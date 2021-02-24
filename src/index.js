import * as THREE from './threejs/build/three.module.js';
import Stats from './threejs/jsm/libs/stats.module.js';
import { GUI } from './threejs/jsm/libs/dat.gui.module.js';
import { TrackballControls } from './threejs/jsm/controls/TrackballControls.js';
import { GLTFLoader } from './threejs/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './threejs/jsm/loaders/RGBELoader.js';
//import { RoughnessMipmapper } from './threejs/jsm/utils/RoughnessMipmapper.js';

let perspectiveCamera, orthographicCamera, controls, scene, renderer, stats;

const params = {
	orthographicCamera: false
};

const frustumSize = 400;

init();
animate();

function init() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 1000 );
	perspectiveCamera.position.z = 500;

	orthographicCamera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
	orthographicCamera.position.z = 500;

	// world

	scene = new THREE.Scene();
	//scene.background = new THREE.Color( 0xcccccc );

	new RGBELoader()
		.setDataType( THREE.UnsignedByteType )
		.setPath( '../assets/hdr/' )
		.load( 'snowy_park_01_1k.hdr', function ( texture ) {

			const envMap = pmremGenerator.fromEquirectangular( texture ).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();

			render();

			// use of RoughnessMipmapper is optional
			//const roughnessMipmapper = new RoughnessMipmapper( renderer );

			const loader = new GLTFLoader().setPath( '../assets/models/' );
			loader.load( 'snowflake.gltf', function ( gltf ) {

				gltf.scene.traverse( function ( child ) {

					if ( child.isMesh ) {

						// TOFIX RoughnessMipmapper seems to be broken with WebGL 2.0
						// roughnessMipmapper.generateMipmaps( child.material );

					}

				} );

				scene.add( gltf.scene );

				//roughnessMipmapper.dispose();

				render();

			} );

		} );

	scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

	

	// lights

	const dirLight1 = new THREE.DirectionalLight( 0xffffff );
	dirLight1.position.set( 1, 1, 1 );
	scene.add( dirLight1 );

	const dirLight2 = new THREE.DirectionalLight( 0x002288 );
	dirLight2.position.set( - 1, - 1, - 1 );
	scene.add( dirLight2 );

	const ambientLight = new THREE.AmbientLight( 0x222222 );
	scene.add( ambientLight );

	// renderer

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1;
	renderer.outputEncoding = THREE.sRGBEncoding;
	document.body.appendChild( renderer.domElement );

	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();

	stats = new Stats();
	document.body.appendChild( stats.dom );

	//

	const gui = new GUI();
	gui.add( params, 'orthographicCamera' ).name( 'use orthographic' ).onChange( function ( value ) {

		controls.dispose();

		createControls( value ? orthographicCamera : perspectiveCamera );

	} );

	//

	window.addEventListener( 'resize', onWindowResize );

	createControls( perspectiveCamera );

}

function createControls( camera ) {

	controls = new TrackballControls( camera, renderer.domElement );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.keys = [ 65, 83, 68 ];

}

function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera.aspect = aspect;
	perspectiveCamera.updateProjectionMatrix();

	orthographicCamera.left = - frustumSize * aspect / 2;
	orthographicCamera.right = frustumSize * aspect / 2;
	orthographicCamera.top = frustumSize / 2;
	orthographicCamera.bottom = - frustumSize / 2;
	orthographicCamera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	controls.handleResize();

}

function animate() {

	requestAnimationFrame( animate );

	controls.update();

	stats.update();

	render();

}

function render() {

	const camera = ( params.orthographicCamera ) ? orthographicCamera : perspectiveCamera;

	renderer.render( scene, camera );

}
