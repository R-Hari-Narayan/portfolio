import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
  private cube!: Three.Mesh;
  private animationId!: number;
  private resizeObserver!: ResizeObserver;

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
    const models = []
    // const dirLight = new Three.DirectionalLight(0xffffff, 5);
    // dirLight.position.set(5, 10, 7.5);
    // this.scene.add(dirLight);

    // // Add ambient light (soft overall light)
    // const ambientLight = new Three.AmbientLight(0xffffff, 0.5);
    // this.scene.add(ambientLight);
    const loader = new GLTFLoader();
    loader.load('assets/models/bicycle/scene.gltf', 
      (gltf) => {
        this.scene.add(gltf.scene);
      }, 
      undefined, 
      function (error) {
        console.error(error);
      }
    );
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
    rgbeLoader.load('assets/hdr/indoor.hdr', (texture) => {
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

    // Cube
    const geometry = new Three.BoxGeometry();
    const material = new Three.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    this.cube = new Three.Mesh(geometry, material);
    //this.scene.add(this.cube);
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
