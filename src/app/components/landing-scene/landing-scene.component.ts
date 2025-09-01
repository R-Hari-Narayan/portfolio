import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';


@Component({
  selector: 'app-landing-scene',
  templateUrl: './landing-scene.component.html',
  styleUrls: ['./landing-scene.component.scss'],
})
export class LandingSceneComponent implements AfterViewInit, OnDestroy {

  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef<HTMLDivElement>;


  private scene!: Three.Scene;
  private camera!: Three.PerspectiveCamera;
  private renderer!: Three.WebGLRenderer;
  private animationId!: number;
  private resizeObserver!: ResizeObserver;
  private models: Three.Object3D[] = [];

  async ngAfterViewInit() {
    const container = this.rendererContainer.nativeElement;

    //Get initial canvas/container size
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;

    this.initThree(width, height)
    // List of models to be loaded
    const modelNames = ['acoustic_guitar', 'bicycle', 'msi_laptop', 'zoro',
      'luffy_hat', 'multimeter', 'android', 'android_mascot'
    ]
    await this.loadModels(modelNames)
    this.setUpScene()
    this.setupControl()
    console.log("Initializing animation")
    this.animate()

    //observe size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        this.onResize(newWidth, newHeight);
      }
    })

    this.resizeObserver.observe(container)
  }

  async loadModels(modelNames: string[]) {
    const loader = new GLTFLoader();
    modelNames.forEach((modelName, index) => {
      loader.load('assets/models/' + modelName + '/scene.gltf',
        (gltf) => {
          const model = gltf.scene;

          //Compute bounding box
          const box = new Three.Box3().setFromObject(model);
          const size = new Three.Vector3();
          box.getSize(size);

          //Find largest dimention
          const maxDim = Math.max(size.x, size.y, size.z);

          //Target size (for now 1 unit cube)
          const desiredSize = 1

          //Scale factor
          const scale = desiredSize / maxDim;

          //Apply scaling
          model.scale.setScalar(scale);

          //Change model initial position
          model.position.setX(index * 2);

          // --- recompute bounding box after scaling ---
          box.setFromObject(model);
          const center = new Three.Vector3();
          box.getCenter(center);

          // --- create bubble (SphereGeometry) ---
          const sphereRadius = box.getSize(new Three.Vector3()).length() / 2;
          const bubbleGeometry = new Three.SphereGeometry(sphereRadius * 1.1, 32, 32); // 1.1 = padding
          const bubbleMaterial = new Three.MeshPhysicalMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.2,
            roughness: 0.2,
            metalness: 0,
            transmission: 0.9, // glass-like
            clearcoat: 1.0
          });
          const bubble = new Three.Mesh(bubbleGeometry, bubbleMaterial);

          // align bubble to model
          bubble.position.copy(center);

          // --- group them together ---
          const group = new Three.Group();
          group.add(model);
          group.add(bubble);

          this.models.push(group);
          this.scene.add(group);
        },
        undefined,
        function (error) {
          console.error(error);
        }
      );
    });
    console.log("All models loaded")
    console.log(this.models)
  }

  setUpScene() {
    console.log("Setting up scene")
    this.models.forEach((bubble) => {
      
    })
  }


  setupControl() {
    const controls = new OrbitControls(this.camera, this.rendererContainer.nativeElement);
    controls.target.set(0, 1, 0);
    controls.update();
  }


  

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }

  private initThree(width: number, height: number) {

    console.log("Initializing threejs")
    //Scene
    this.scene = new Three.Scene();

    // Load HDR environment
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('assets/hdr/indoor2.hdr', (texture) => {
      texture.mapping = Three.EquirectangularReflectionMapping;

      this.scene.background = new Three.Color(0x87CEEB);
      this.scene.environment = texture;     // Crucial: light/reflections
    });

    //Camera
    this.camera = new Three.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    //Renderer
    this.renderer = new Three.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x222222);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  private animate = () => {
  this.animationId = requestAnimationFrame(this.animate);

  const top = 5;     // y at which bubbles reset
  const bottom = -5; // start y
  const speedMin = 0.01;
  const speedMax = 0.03;

  this.models.forEach((group: any) => {
    // store speed on the group (once)
    if (!group.userData.speed) {
      group.userData.speed = speedMin + Math.random() * (speedMax - speedMin);
    }

    // move upward
    group.position.y += group.userData.speed;

    // rotate
    
    group.rotation.x += 0.01;
    //group.rotation.z += 0.01;
    

    // reset if above top
    if (group.position.y > top) {
      group.position.y = bottom;
      group.position.x = (Math.random() - 0.5) * 10; // random X in [-5,5]
      group.position.z = (Math.random() - 0.5) * 5; // random Z in [-5,5]
      group.userData.speed = speedMin + Math.random() * (speedMax - speedMin);
    }
  });

  this.renderer.render(this.scene, this.camera);
};


  private onResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
