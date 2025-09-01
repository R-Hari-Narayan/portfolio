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

  ngAfterViewInit() {
    const container = this.rendererContainer.nativeElement;

    //Get initial size
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;

    this.initThree(width, height)
    this.loadModels()
    this.setupControl()
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


  setupControl() {
    const controls = new OrbitControls(this.camera, this.rendererContainer.nativeElement);
    controls.target.set(0,1,0);
    controls.update();
  }


  loadModels() {
    // Add a directional light
    const modelNames = ['acoustic_guitar', 'bicycle', 'msi_laptop', 'zoro',
      'luffy_hat', 'multimeter', 'android', 'android_mascot'
    ]
    const loader = new GLTFLoader();
    modelNames.forEach((modelName, index) => {
      loader.load('assets/models/'+modelName+'/scene.gltf', 
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
          model.position.setX(index*2)

          this.models.push(model);

          this.scene.add(model);
        }, 
        undefined, 
        function (error) {
          console.error(error);
        }
      );
    }); 
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

    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera)
  };

  private onResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
