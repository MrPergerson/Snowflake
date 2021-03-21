import * as THREE from '../src/threejs/build/three.module.js';
import { TrackballControls } from '../src/threejs/jsm/controls/TrackballControls.js';
import { RGBELoader } from '../src/threejs/jsm/loaders/RGBELoader.js';

let perspectiveCamera, controls, scene, renderer, stats;
let cameraPosZ = 25;
let canAnimate = true;
let snowflakes = new Array();


init();
animate();

$("#PauseButton").click(function() {
	canAnimate = false;
});

$("#ResumeButton").click(function() {
	canAnimate = true;
});


function init() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 1000 );
	perspectiveCamera.position.z = cameraPosZ;

	// renderer

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.outputEncoding = THREE.sRGBEncoding;
	document.body.appendChild( renderer.domElement );

	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();

	// world

	scene = new THREE.Scene();

	new RGBELoader()
		.setDataType( THREE.UnsignedByteType )
		.setPath( '../assets/hdr/' )
		.load( 'snowy_park_01_blurred_1k.hdr', function ( texture ) {

			const envMap = pmremGenerator.fromEquirectangular( texture ).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();

			render();
	});

	for ( let i = 0; i < 100; i ++ ) {

		loadSnowFlakeImage();

	}		

	window.addEventListener( 'resize', onWindowResize );

	render();

}

function loadSnowFlakeImage()
{
    var texture = new THREE.TextureLoader().load('../assets/images/snowflake/snowflake2.png');
	var alphaTexture = new THREE.TextureLoader().load('../assets/images/snowflake/snowflake_alpha.png');
    var geometry = flipY( new THREE.PlaneBufferGeometry() );
	var material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: texture, transparent: true, alphaMap: alphaTexture } );
	
	var mesh = new THREE.Mesh( geometry, material );

	mesh.position.x = Math.random() * 50 - 25;
	mesh.position.y = Math.random() * 50 - 25;
	mesh.position.z = Math.random() * 200-200;

	snowflakes.push(mesh);
	scene.add( mesh );

}

function animateSnowFlake(mesh)
{
	mesh.rotation.z += .01;
	//mesh.position.y -= .01;
	//mesh.position.x += .005;
	mesh.position.z += 4;

	mesh.scale.x += .01;
	mesh.scale.y += .01;

	if(mesh.scale.x > 8)
	{
		mesh.scale.x = 1;
		mesh.scale.y = 1
	}

	if(mesh.position.y < -20)
		mesh.position.y = 20;

	if(mesh.position.z > cameraPosZ)
		mesh.position.z = cameraPosZ - 200;
}

/** Correct UVs to be compatible with `flipY=false` textures. */
function flipY( geometry ) {

    const uv = geometry.attributes.uv;

    for ( let i = 0; i < uv.count; i ++ ) {

        uv.setY( i, 1 - uv.getY( i ) );

    }

    return geometry;

}


function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera.aspect = aspect;
	perspectiveCamera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	//controls.handleResize();

}

function animate() {

	if(canAnimate)
	{

		
		for(var i = 0; i < snowflakes.length; i++)
		{
			animateSnowFlake(snowflakes[i]);
		}
		
	}
		requestAnimationFrame( animate );
		
		render();

}

function render() {

	const camera = perspectiveCamera;

	renderer.render( scene, camera );

}
