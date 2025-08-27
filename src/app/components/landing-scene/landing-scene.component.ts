import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as Three from 'three';

@Component({
  selector: 'app-landing-scene',
  templateUrl: './landing-scene.component.html',
  styleUrls: ['./landing-scene.component.scss'],
})
export class LandingSceneComponent  implements AfterViewInit, OnDestroy {

  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;


  private scene!: Three.Scene;
  private camera!: Three.Camera;
  private renderer!: Three.WebGLRenderer;
  private cube!: Three.Mesh;
  private animationId!: number;

  ngAfterViewInit() {
    this.initThree()
    //this.renderer.render(this.scene, this.camera)
    this.animate()
  }

  ngOnDestroy(): void {
      
  }

  private initThree() {

    console.log("Initializing threejs")
    //Scene
    this.scene = new Three.Scene();

    //Camera
    this.camera = new Three.PerspectiveCamera(
      75,
      this.rendererContainer.nativeElement.clientWidth / this.rendererContainer.nativeElement.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    //Renderer
    this.renderer = new Three.WebGLRenderer({antialias: true});
    console.log(
      "Container size:",
      500,
      500
    );
    this.renderer.setSize(
      500,
      500
    );
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Cube
    const geometry = new Three.BoxGeometry();
    const material = new Three.MeshBasicMaterial({ color: 0xffffff, wireframe: true});
    this.cube = new Three.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  private animate = () => {
    console.log("Starting animation");
    this.animationId = requestAnimationFrame(this.animate);

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera)
  };
}
