import * as THREE from './threejs/build/three.module.js';
import Stats from './threejs/jsm/libs/stats.module.js';
import { GUI } from './threejs/jsm/libs/dat.gui.module.js';
import { TrackballControls } from './threejs/jsm/controls/TrackballControls.js';
import { GLTFLoader } from './threejs/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './threejs/jsm/loaders/RGBELoader.js';
//import { RoughnessMipmapper } from './threejs/jsm/utils/RoughnessMipmapper.js';
import { BasisTextureLoader } from './threejs/jsm/loaders/BasisTextureLoader.js';

let perspectiveCamera, controls, scene, renderer, stats;
let snowFlakeMaterial;
const frustumSize = 400;

init();
animate();

function init() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 1000 );
	perspectiveCamera.position.z = 50;

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

            /*
			snowFlakeMaterial = new THREE.MeshPhysicalMaterial({
				refractionRatio: 0.98,
				envMap: envMap,
				transparent: params.transparent,
				transmission: params.transmission,
				opacity: params.opacity,
				roughness: params.roughness
			});
            */
	});

	for ( let i = 0; i < 100; i ++ ) {

		loadSnowFlakeImage();

	}		

	window.addEventListener( 'resize', onWindowResize );

	createControls( perspectiveCamera );

	render();

}

function loadSnowFlakeImage()
{
    var texture = new THREE.TextureLoader().load( './assets/images/snowflake/snowflake2.png');
    var geometry = flipY( new THREE.PlaneBufferGeometry() );
	var material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: texture } );
	
	var mesh = new THREE.Mesh( geometry, material );

        /*
        loader.load('./assets/images/snowflake/snowflake_alpha.png', function (alphamap) {
            material.alphaMap = alphamap;
        });
        */ 
        //material.needsUpdate = true;

	mesh.position.x = Math.random() * 100 - 50;
	mesh.position.y = Math.random() * 100 - 50;
	mesh.position.z = Math.random() * 20 - 10;

	scene.add( mesh );

}

/** Correct UVs to be compatible with `flipY=false` textures. */
function flipY( geometry ) {

    const uv = geometry.attributes.uv;

    for ( let i = 0; i < uv.count; i ++ ) {

        uv.setY( i, 1 - uv.getY( i ) );

    }

    return geometry;

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

	render();

}

function render() {

	const camera = perspectiveCamera;

	renderer.render( scene, camera );

}
