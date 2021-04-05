import * as THREE from '../src/threejs/build/three.module.js';
import { GLTFLoader } from '../src/threejs/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../src/threejs/jsm/loaders/RGBELoader.js';

let perspectiveCamera, controls, scene, renderer, stats;
let clock = new THREE.Clock();
let cameraPosZ = 25;
let cameraTargetZoom = 1;
let currentCameraPos, targetCameraPos, targetCameraRot;
let canAnimate = true;
let stage1_snowflakes = new Array();
let stage1_snowflakeGroup = new THREE.Group();
let stage1_snowflake_targetPos;
let stage2_snowFlakeModel;
let stage2_snowFlake_targetPos, stage2_snowFlake_targetScale;
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
	targetCameraPos = new THREE.Vector3(0,0,25);
	//cameraTargetZoom = 1;
	perspectiveCamera.position.copy(targetCameraPos);

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

	stage2_snowFlake_targetPos = new THREE.Vector3(0,0,-700);
	stage2_snowFlake_targetScale = new THREE.Vector3(.4,.4,.4);
	// load the snowflake 3D model
	loadSnowFlakeModel();

	// load snowflake ground
	loadSnowGroundModel();

	stage1_snowflake_targetPos = new THREE.Vector3(0,0,0);
	stage1_snowflakeGroup.position.copy(stage1_snowflake_targetPos);
	// load all the snowflake images
	loadSnowFlakeImage(100);

	

	window.addEventListener( 'resize', onWindowResize );

	render();

}

function changeStage(state)
{
	isTransitioning = true;

	switch(state)
	{
		case 1:
			if(currentState == 1) break;
			transitionToStage1();
			currentState = 1;
			break;
		case 2:
			if(currentState == 2) break;
			transitionToStage2();
			currentState = 2;
			break;
		case 3:
			if(currentState == 3) break;
			transitionToStage3();
			currentState = 3;
			break;
		default:

	}
}

function transitionToStage1()
{
	//stage2_snowFlakeModel.visible = false;
	//stage3_snowgroundModel.visible = false;
	/*
	for(var i = 0; i < stage1_snowflakes.length; i++)
	{
		setSnowFlakeImagePosition(stage1_snowflakes[i]);
	}
	*/
	stage1_snowflake_targetPos = new THREE.Vector3(0,0,0);
	stage2_snowFlake_targetPos = new THREE.Vector3(0,0,-700);
	stage2_snowFlake_targetScale = new THREE.Vector3(.4,.4,.4);
	targetCameraPos = new THREE.Vector3(0,0,25);
	cameraTargetZoom = 1;
}

function transitionToStage2()
{
	//stage3_snowgroundModel.visible = false;
	stage1_snowflake_targetPos = new THREE.Vector3(0,0,30);
	stage2_snowFlakeModel.position.copy(new THREE.Vector3(0,0,-700));
	stage2_snowFlakeModel.scale.copy(new THREE.Vector3(.4,.4,.4));
	//stage2_snowFlakeModel.rotation.copy(new THREE.Vector3(0,0,0));
	stage2_snowFlakeModel.visible = true;
	//perspectiveCamera.position.y = 0;
	targetCameraPos = new THREE.Vector3(0,0,25);
	isTransitioning = true;
	cameraTargetZoom = 2;
}

function transitionToStage3()
{
	stage1_snowflake_targetPos = new THREE.Vector3(0,0,0);
	/*
	for(var i = 0; i < stage1_snowflakes.length; i++)
	{
		setSnowFlakeImagePosition(stage1_snowflakes[i]);
	}
	*/
	stage2_snowFlakeModel.visible = true;
	stage2_snowFlakeModel.position.copy(new THREE.Vector3(0,-10,12));
	stage2_snowFlakeModel.scale.copy(new THREE.Vector3(.1,.1,.1));
	//stage3_snowgroundModel.visible = true;
	//perspectiveCamera.position.y = 0;

	
	targetCameraPos = new THREE.Vector3(0,-40,25);
	cameraTargetZoom = 1;


}

// Loads mesh planes with snowflake texture
function loadSnowFlakeImage(amount)
{
    var texture = new THREE.TextureLoader().load('../assets/images/snowflake/snowflake2.png');
	var alphaTexture = new THREE.TextureLoader().load('../assets/images/snowflake/snowflake_alpha.png');
    var geometry = flipY( new THREE.PlaneBufferGeometry() );
	var material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: texture, transparent: true, alphaMap: alphaTexture } );
	
	for ( let i = 0; i < amount; i ++ ) 
	{
		var mesh = new THREE.Mesh( geometry, material );
		setSnowFlakeImagePosition(mesh);
		stage1_snowflakes.push(mesh);
		stage1_snowflakeGroup.add(mesh);
		
	}
	
	scene.add( stage1_snowflakeGroup );
	loadCount++;

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

		loadCount++;
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
		mesh.position.y = -46;
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
		//stage3_snowgroundModel.visible = false;

		render();

		loadCount++;
	});
}

// update the position and scale of the snowflake image planes
function animateSnowFlake()
{		
	for(var i = 0; i < stage1_snowflakes.length; i++)
	{
		var mesh = stage1_snowflakes[i];
		mesh.rotation.z += .01;
		mesh.position.y -= .01;

		if(mesh.position.y < -20)
			mesh.position.y = 20;
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

	if(loadCount == 3)
	{	
		let stage1_snowflake_currentPos = stage1_snowflakeGroup.position;
		switch(currentState)
		{
			case 1:
				var newZPos = THREE.MathUtils.lerp(stage1_snowflake_currentPos.z, stage1_snowflake_targetPos.z, .05);
				stage1_snowflakeGroup.position.copy(new THREE.Vector3(0,0,newZPos)); 		
				
				stage2_snowFlakeModel.position.lerp(stage2_snowFlake_targetPos, .05);
				stage2_snowFlakeModel.scale.lerp(stage2_snowFlake_targetScale,.05);

				if(Math.abs(stage2_snowFlake_targetPos.z - stage2_snowFlakeModel.position.z) < 1)
				{
					stage2_snowFlakeModel.visible = false;
				}
				
				break;
			case 2:
				var newZPos = THREE.MathUtils.lerp(stage1_snowflake_currentPos.z, stage1_snowflake_targetPos.z, .05);
				stage1_snowflakeGroup.position.copy(new THREE.Vector3(0,0,newZPos)); 
				
				if(stage2_snowFlakeModel.position.z < 2)
				{
					stage2_snowFlakeModel.position.z += 4;
					//camreaZoomIn(4,.01);
					
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
						
						//mesh.scale.x += .01;
						//mesh.scale.y += .01;
						mesh.rotation.z += .01;
						//mesh.position.z += .5;
						
						//if(mesh.position.z > cameraPosZ)
						//mesh.position.z = cameraPosZ - 200;
					}
				}
			
			break;
			case 3:
				//cameraZoomOut(-1);
				
				if(stage2_snowFlakeModel.position.y > -40)
				{
					stage2_snowFlakeModel.position.y -= .05;
				}
				
				break;
		}
				
		animateSnowFlake();
		
		perspectiveCamera.zoom = THREE.MathUtils.lerp(perspectiveCamera.zoom,cameraTargetZoom,.01);
		perspectiveCamera.position.lerp(targetCameraPos, .01);
		perspectiveCamera.updateProjectionMatrix();
	
	}
			
	requestAnimationFrame( animate );
	
	render();
			
}

function render() {
	
	const camera = perspectiveCamera;
	
	renderer.render( scene, camera );
	
}
