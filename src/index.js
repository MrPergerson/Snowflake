import * as THREE from '../src/threejs/build/three.module.js';
import { GLTFLoader } from '../src/threejs/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../src/threejs/jsm/loaders/RGBELoader.js';

let perspectiveCamera, controls, scene, renderer, stats;
let cameraPosZ = 25;
let canAnimate = true;
let stage1_snowflakes = new Array();
let stage2_snowFlakeModel;
let stage3_snowgroundModel;
let canLoad = true;
let loadCount = 0;
let finishedLoading = false;
let isTransitioning = false;
let environmentMap;

let currentState = 1;


init();
animate();

// EXAMPLE 1
$("#stage1").click(function() {
	changeStage(1);
});

$("#stage2").click(function() {
	changeStage(2);
});

$("#stage3").click(function() {
	changeStage(3);
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

	scene = new THREE.Scene();

	// load the HDR background
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

	// load the snowflake 3D model
	loadSnowFlakeModel();

	// load snowflake ground
	loadSnowGroundModel();

	// load all the snowflake images
	for ( let i = 0; i < 100; i ++ ) {

		loadSnowFlakeImage();

	}		

	window.addEventListener( 'resize', onWindowResize );

	render();

}

function changeStage(state)
{
	isTransitioning = true;

	switch(state)
	{
		case 1:
			transitionToStage1();
			currentState = 1;
			break;
		case 2:
			transitionToStage2();
			currentState = 2;
			break;
		case 3:
			transitionToStage3();
			currentState = 3;
			break;
		default:

	}
}

function transitionToStage1()
{
	stage2_snowFlakeModel.visible = false;
	stage3_snowgroundModel.visible = false;
	for(var i = 0; i < stage1_snowflakes.length; i++)
	{
		setSnowFlakeImagePosition(stage1_snowflakes[i]);
	}
	perspectiveCamera.position.y = 0;
}

function transitionToStage2()
{
	stage3_snowgroundModel.visible = false;
	stage2_snowFlakeModel.position.copy(new THREE.Vector3(0,0,-700));
	stage2_snowFlakeModel.scale.copy(new THREE.Vector3(.4,.4,.4));
	//stage2_snowFlakeModel.rotation.copy(new THREE.Vector3(0,0,0));
	stage2_snowFlakeModel.visible = true;
	perspectiveCamera.position.y = 0;
	isTransitioning = true;
}

function transitionToStage3()
{
	for(var i = 0; i < stage1_snowflakes.length; i++)
	{
		setSnowFlakeImagePosition(stage1_snowflakes[i]);
	}
	stage2_snowFlakeModel.visible = true;
	stage2_snowFlakeModel.position.copy(new THREE.Vector3(0,8,12));
	stage2_snowFlakeModel.scale.copy(new THREE.Vector3(.1,.1,.1));
	stage3_snowgroundModel.visible = true;
	perspectiveCamera.position.y = 0;
}

// Loads mesh planes with snowflake texture
function loadSnowFlakeImage()
{
    var texture = new THREE.TextureLoader().load('../assets/images/snowflake/snowflake2.png');
	var alphaTexture = new THREE.TextureLoader().load('../assets/images/snowflake/snowflake_alpha.png');
    var geometry = flipY( new THREE.PlaneBufferGeometry() );
	var material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: texture, transparent: true, alphaMap: alphaTexture } );
	
	var mesh = new THREE.Mesh( geometry, material );

	setSnowFlakeImagePosition(mesh);

	/*
	mesh.position.x = Math.random() * 50 - 25;
	mesh.position.y = Math.random() * 50 - 25;
	mesh.position.z = Math.random() * 200-200;
	*/
	stage1_snowflakes.push(mesh);
	scene.add( mesh );

}

function setSnowFlakeImagePosition(mesh)
{
	mesh.position.x = Math.random() * 50 - 25;
	mesh.position.y = Math.random() * 50 - 25;
	mesh.position.z = Math.random() * 20 - 10;
	mesh.scale.x = 1;
	mesh.scale.y = 1;
}

// the the GLTF model of the snowflake and assigns a material
function loadSnowFlakeModel()
{
	const loader = new GLTFLoader().setPath( './assets/models/snowflake/' );
	loader.load('snowflake.gltf', function (gltf) {
		let snowFlakeMaterial = new THREE.MeshPhysicalMaterial({
			refractionRatio: 0.98,
			envMap: environmentMap,
			transparent: true,
			transmission: .5,
			opacity: 1,
			roughness: 0
		});

		const loader = new THREE.TextureLoader()
		.setPath( './assets/textures/snowflake/' );

		var mesh = gltf.scene.children[0];
		mesh.material = snowFlakeMaterial;

		const diffuseMap = loader.load( 'snowflake_tex_diffuse.jpg' );
		diffuseMap.encoding = THREE.sRGBEncoding;
		snowFlakeMaterial.map = diffuseMap;
		snowFlakeMaterial.normalMap = loader.load( 'snowflake_tex_normal.png' );

		scene.add( gltf.scene );
		stage2_snowFlakeModel = mesh;

		// can this be removed? Maybe have a loading screen
		stage2_snowFlakeModel.visible = false;

		render();
	});

}

function loadSnowGroundModel()
{
	const loader = new GLTFLoader().setPath( './assets/models/snowground/' );
	loader.load('snowground.gltf', function (gltf) {
		/*
		let snowFlakeMaterial = new THREE.MeshPhysicalMaterial({
			refractionRatio: 0.98,
			envMap: environmentMap,
			transparent: true,
			transmission: .5,
			opacity: 1,
			roughness: 0
		});
		*/
		const loader = new THREE.TextureLoader()
		.setPath( '../assets/models/snowground/' );

		var mesh = gltf.scene.children[0];
		mesh.scale.x = 50;
		mesh.scale.y = 50;
		mesh.scale.z = 50;
		mesh.position.y = -16;
		mesh.position.z = 10;
		//mesh.material = snowFlakeMaterial;

		/*
		const diffuseMap = loader.load( 'snowflake_tex_diffuse.jpg' );
		diffuseMap.encoding = THREE.sRGBEncoding;
		snowFlakeMaterial.map = diffuseMap;
		snowFlakeMaterial.normalMap = loader.load( 'snowflake_tex_normal.png' );
		*/
		scene.add( gltf.scene );
		stage3_snowgroundModel = mesh;

		// can this be removed? Maybe have a loading screen
		stage3_snowgroundModel.visible = false;

		render();
	});
}

// update the position and scale of the snowflake image planes
// contains EXAMPLE 2
function animateSnowFlake(mesh)
{		
	mesh.rotation.z += .01;
	mesh.position.y -= .01;

	if(mesh.position.y < -20)
		mesh.position.y = 20;
}

// set all the snowflake planes to either visible or invisible
function transitionSetActive(value)
{
	isTransitioning = value;
	for (var i = 0; i < stage1_snowflakes.length; i++)
	{
		stage1_snowflakes[i].visible = value;
	}
}

function camreaZoomIn(targetZoom, rate)
{
	if(perspectiveCamera.zoom >= targetZoom)
	{
		perspectiveCamera.zoom = 1;
		perspectiveCamera.updateProjectionMatrix();
		return true;
	} else
	{
		perspectiveCamera.zoom += rate;
		perspectiveCamera.updateProjectionMatrix();
		return false;
	}

	
}

function cameraZoomOut(rate = -1)
{

	if(rate <= 0)
	{
		perspectiveCamera.zoom = 1;
		perspectiveCamera.updateProjectionMatrix();
		return true;
	}

	if(perspectiveCamera.zoom <= 1)
	{
		perspectiveCamera.zoom = 1;
		perspectiveCamera.updateProjectionMatrix();
		return true;
	} 
	else
	{
		perspectiveCamera.zoom -= rate;
		perspectiveCamera.updateProjectionMatrix();
		return false;
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


	switch(currentState)
	{
		case 1:
			if(isTransitioning)
			{
				// How can I reverse the transition?
				// Can I group the snowflakes into an parent object?
				var hasFinishedZooming = cameraZoomOut(.01);
				if(hasFinishedZooming) isTransitioning = false;

			}

			for(var i = 0; i < stage1_snowflakes.length; i++)
			{
				animateSnowFlake(stage1_snowflakes[i]);
			}
			break;
		case 2:
			if(stage2_snowFlakeModel.position.z < 2)
			{
				stage2_snowFlakeModel.position.z += 4;
				camreaZoomIn(4,.01);

			}
			else
			{
				isTransitioning = false;			
			}

			stage2_snowFlakeModel.rotation.x += .01;
			stage2_snowFlakeModel.rotation.z += .001;

			if(isTransitioning)
			{
				for(var i = 0; i < stage1_snowflakes.length; i++)
				{
					var mesh = stage1_snowflakes[i];
					
					mesh.scale.x += .01;
					mesh.scale.y += .01;
					mesh.rotation.z += .01;
					mesh.position.z += .5;
					
					//if(mesh.position.z > cameraPosZ)
						//mesh.position.z = cameraPosZ - 200;
				}
			}

			break;
		case 3:
			cameraZoomOut(-1);

			if(perspectiveCamera.position.y > -10)
			{
				perspectiveCamera.position.y -= .1; 
			}

			if(stage2_snowFlakeModel.position.y > -10)
			{
				stage2_snowFlakeModel.position.y -= .05;
			}

			for(var i = 0; i < stage1_snowflakes.length; i++)
			{
				animateSnowFlake(stage1_snowflakes[i]);
			}

			break;
	}



	requestAnimationFrame( animate );
	
	render();

}

function render() {

	const camera = perspectiveCamera;

	renderer.render( scene, camera );

}
