import * as THREE from './threejs/build/three.module.js';
import Stats from './threejs/jsm/libs/stats.module.js';
import { GUI } from './threejs/jsm/libs/dat.gui.module.js';
import { TrackballControls } from './threejs/jsm/controls/TrackballControls.js';
import { GLTFLoader } from './threejs/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './threejs/jsm/loaders/RGBELoader.js';
//import { RoughnessMipmapper } from './threejs/jsm/utils/RoughnessMipmapper.js';

let perspectiveCamera, controls, scene, renderer, stats;
let snowFlakeMaterial;
const params = {
	transparent: true,
	transmission: .5,
	opacity: 1,
	roughness: 0,
	exposure: 1
};  
const frustumSize = 400;


init();
animate();

function init() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 1000 );
	perspectiveCamera.position.z = 10;

	// world

	scene = new THREE.Scene();
	//scene.background = new THREE.Color( 0xcccccc );

	new RGBELoader()
		.setDataType( THREE.UnsignedByteType )
		.setPath( './assets/hdr/' )
		.load( 'snowy_park_01_blurred_1k.hdr', function ( texture ) {

			const envMap = pmremGenerator.fromEquirectangular( texture ).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();

			render();

			// use of RoughnessMipmapper is optional
			//const roughnessMipmapper = new RoughnessMipmapper( renderer );

			snowFlakeMaterial = new THREE.MeshPhysicalMaterial({
				refractionRatio: 0.98,
				envMap: envMap,
				transparent: params.transparent,
				transmission: params.transmission,
				opacity: params.opacity,
				roughness: params.roughness
			});
		
			loadSnowFlake();
			

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

	setUpDebugGUI();

	window.addEventListener( 'resize', onWindowResize );

	createControls( perspectiveCamera );

}

function loadSnowFlake()
{
	const loader = new GLTFLoader().setPath( './assets/models/snowflake/' );
	loader.load('snowflake_highquality.gltf', function ( gltf ) {

		const loader = new THREE.TextureLoader()
							.setPath( './assets/textures/snowflake/' );


		var mesh = gltf.scene.children[0];
		mesh.material = snowFlakeMaterial;

		const diffuseMap = loader.load( 'snowflake_tex_diffuse.jpg' );
		diffuseMap.encoding = THREE.sRGBEncoding;
		snowFlakeMaterial.map = diffuseMap;
		snowFlakeMaterial.normalMap = loader.load( 'snowflake_tex_normal.png' );

		scene.add( gltf.scene );

		//roughnessMipmapper.dispose();

		render();

		} );
}

function setUpDebugGUI()
{
	stats = new Stats();
	document.body.appendChild( stats.dom );

	//

	const gui = new GUI( { width: 300 } );

	const folderSFMat = gui.addFolder( 'Snowflake Material' );
	folderSFMat.add(params, 'transparent').name( 'Transparent' );
	folderSFMat.add(params, 'transmission', 0, 1).name( 'Transmission' );
	folderSFMat.add(params, 'opacity', 0, 1).name( 'Opacity' );
	folderSFMat.add(params, 'roughness', 0, 1).name( 'Roughness' );

	/*
	folderSFMat.add( snowFlakeMaterial, 'spline', Object.keys( splines ) ).onChange( function () {

		addTube();

	} );
	*/


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

	const camera = perspectiveCamera;

	renderer.render( scene, camera );

}
