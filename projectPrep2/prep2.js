import * as THREE from '../src/threejs/build/three.module.js';
import { GLTFLoader } from '../src/threejs/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../src/threejs/jsm/loaders/RGBELoader.js';

let perspectiveCamera, controls, scene, renderer, stats;
let cameraPosZ = 25;
let canAnimate = true;
let snowflakes = new Array();
let snowFlakeModel;
let canLoad = true;
let isTransitioning = true;
let environmentMap;


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

			environmentMap = pmremGenerator.fromEquirectangular( texture ).texture;

			scene.background = environmentMap;
			scene.environment = environmentMap;

			texture.dispose();
			pmremGenerator.dispose();

			render();


	});

	loadSnowFlakeModel();

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

function loadSnowFlakeModel()
{
	let snowFlakeMaterial = new THREE.MeshPhysicalMaterial({
		refractionRatio: 0.98,
		envMap: environmentMap,
		transparent: true,
		transmission: .5,
		opacity: 1,
		roughness: 0
	});

	const loader = new GLTFLoader().setPath( '../assets/models/snowflake/' );
	loader.load('snowflake_highquality.gltf', function ( gltf ) {

		const loader = new THREE.TextureLoader()
							.setPath( '../assets/textures/snowflake/' );


		var mesh = gltf.scene.children[0];
		mesh.material = snowFlakeMaterial;

		const diffuseMap = loader.load( 'snowflake_tex_diffuse.jpg' );
		diffuseMap.encoding = THREE.sRGBEncoding;
		snowFlakeMaterial.map = diffuseMap;
		snowFlakeMaterial.normalMap = loader.load( 'snowflake_tex_normal.png' );

		scene.add( gltf.scene );
		snowFlakeModel = mesh;
		snowFlakeModel.visible = false;

		//roughnessMipmapper.dispose();

		

		render();

		} );
}

function animateSnowFlake(mesh)
{
	if(isTransitioning)
	{
		if(mesh.scale.x > 8)
		{
			if(canLoad)
			{
				// move this some where else..
				snowFlakeModel.visible = true;
				transitionSetActive(false);
				canLoad = false;
			}
	
		}
		mesh.scale.x += .01;
		mesh.scale.y += .01;
		mesh.rotation.z += .01;
		//mesh.position.y -= .01;
		//mesh.position.x += .005;
		mesh.position.z += 4;

		if(mesh.position.y < -20)
		mesh.position.y = 20;

		if(mesh.position.z > cameraPosZ)
			mesh.position.z = cameraPosZ - 200;
	}


}

function transitionSetActive(value)
{
	isTransitioning = value;
	for (var i = 0; i < snowflakes.length; i++)
	{
		snowflakes[i].visible = value;
	}
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
