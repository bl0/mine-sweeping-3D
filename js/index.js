// color
var color_default = 0x23EA14;
var color_safe = 0x1A25E4;
var color_dangerous = 0xEB1318;
var color_bomb = 0x000000;

// text
var textSize = 40;
var textHeight = textSize / 4;
var textFontUrl = 'fonts/optimer_bold.typeface.json';
var textHover = 0;
var font = null;

// sphere
var sphereInterval = 120;
var sphereOffset = -200;
// GameState
var GAMESTATE_DEFAULT = 0;
var GAMESTATE_SAFE = 1;
var GAMESTATE_DANGEROUS = 2;
var GAMESTATE_BOMB = 3;

//
if (!Detector.webgl)
	Detector.addGetWebGLMessage();
var container, stats;
var camera, scene, renderer, controls, objects = [], texts = [];
var mouse, intersect, raycaster;
var loader = new THREE.FontLoader();

//
var numberOfSphersPerSide = 5;

//init 3D objects Array
var position_objects = new Array(numberOfSphersPerSide);
for (var i = 0; i < position_objects.length; i++) {
	position_objects[i] = new Array(numberOfSphersPerSide);
}
for (var i = 0; i < position_objects.length; i++) {
	for (var j = 0; j < position_objects[i].length; j++) {
		position_objects[i][j] = new Array(numberOfSphersPerSide);
	}
}

loader.load('fonts/gentilis_regular.typeface.json', function(_font) {
	font = _font;
	init(font);
	animate();
});

function init(font) {
	//
	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 2000);
	camera.position.set(0.0, 400, 400 * 3.5);

	// Background
	var reflectionCube = new THREE.CubeTextureLoader()
		.setPath('textures/cube/MilkyWay/')
		.load(['dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg']);
	reflectionCube.format = THREE.RGBFormat;
	scene = new THREE.Scene();
	scene.background = reflectionCube;

	var cubeWidth = 400;
	var sphereRadius = (cubeWidth / numberOfSphersPerSide) * 0.7 * 0.5;
	var geometry = new THREE.SphereBufferGeometry(sphereRadius, 32, 16);
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	// sphere
	for (var x = 0; x < numberOfSphersPerSide; x++) {
		for (var y = 0; y < numberOfSphersPerSide; y++) {
			for (var z = 0; z < numberOfSphersPerSide; z++) {
				var material = new THREE.MeshPhongMaterial( {
					color: color_default,
					specular: 0x00FF64,
					shininess: 30,
					shading: THREE.SmoothShading
				} )
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.x = x * sphereInterval + sphereOffset;
				mesh.position.y = y * sphereInterval + sphereOffset;
				mesh.position.z = z * sphereInterval + sphereOffset;

				//init the state of balls
				mesh.state = GAMESTATE_DEFAULT;
				mesh.bombNum = 0;
				mesh.position_x = x;
				mesh.position_y = y;
				mesh.position_z = z;

				objects.push(mesh);
				position_objects[x][y][z] = mesh;
				scene.add(mesh);
			}
		}
	}

	// game
	var numberOfBomb = 20;
	gameInit(numberOfBomb);


	// RENDER
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setClearColor(0x0a0a0a);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.sortObjects = true;
	container.appendChild(renderer.domElement);
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	//
	stats = new Stats();
	container.appendChild(stats.dom);
	controls = new THREE.OrbitControls(camera);
	controls.target.set(0, 0, 0);
	controls.update();
	// EVENT LISTENER
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	window.addEventListener('resize', onWindowResize, false);

	// LIGHT
	var dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
	dirLight.position.set(0, 0, 1).normalize();
	scene.add(dirLight);

	dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
	dirLight.position.set(0, 1, 0).normalize();
	scene.add(dirLight);

	dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
	dirLight.position.set(1, 0, 0).normalize();
	scene.add(dirLight);
}
// To decide which object is bomb.
function gameInit(numberOfBomb) {
	var bombReserve = numberOfBomb;
	var count = 0;
	for (var i = 0, l = objects.length; i < l; i++) {
		var p = bombReserve / (l - i);
		if(Math.random() <= p){
			objects[i].isBomb = true;
			bombReserve --;
		}
		else{
			objects[i].isBomb = false;
		}
		count += objects[i].isBomb ? 1 : 0;
	}
	console.log(count);

	addBorder();
}

function addBorder(){
	var material = new THREE.LineBasicMaterial({
		color: 0xFFFFFF
	});
	var coodinate_value = function(index){
		return sphereOffset + sphereInterval * (index);
	}
	var MAX = coodinate_value(numberOfSphersPerSide - 1);
	var MIN = coodinate_value(0);
	for(var x = MIN; x <= MAX; x += sphereInterval){
		for(var y = MIN; y <= MAX; y += sphereInterval){
			var geometry_1 = new THREE.Geometry();
			geometry_1.vertices.push(
				new THREE.Vector3( MIN, x, y ),
				new THREE.Vector3( MAX, x, y )
			);
			var line_1 = new THREE.Line( geometry_1, material );
			scene.add( line_1 );

			var geometry_2 = new THREE.Geometry();
			geometry_2.vertices.push(
				new THREE.Vector3( x, MIN, y ),
				new THREE.Vector3( x, MAX, y )
			);
			var line_2 = new THREE.Line( geometry_2, material );
			scene.add( line_2 );

			var geometry_3 = new THREE.Geometry();
			geometry_3.vertices.push(
				new THREE.Vector3( x, y, MIN ),
				new THREE.Vector3( x, y, MAX )
			);
			var line_3 = new THREE.Line( geometry_3, material );
			scene.add( line_3 );
		}
	}

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
//
function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function loadFont() {
	var loader = new THREE.FontLoader();
	loader.load(textFontUrl, function(response) {
		font = response;
	});
}

function createText(text, position) {
	var material = new THREE.MultiMaterial([
		new THREE.MeshPhongMaterial({
			color: 0xF8F206,
			shading: THREE.FlatShading
		}), // front
		new THREE.MeshPhongMaterial({
			color: 0xFFE200,
			shading: THREE.SmoothShading
		}) // side
	]);

	var group = new THREE.Group();
	group.position.x = position.x;
	group.position.y = position.y;
	group.position.z = position.z;

	scene.add(group);

	var textGeo = new THREE.TextGeometry(text, {
		font: font,
		size: textSize,
		height: textHeight,
		material: 2,
		extrudeMaterial: 1
	});

	textGeo.computeBoundingBox();
	textGeo.computeVertexNormals();

	var centerOffset_x = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
	var centerOffset_y = -0.5 * (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);
	var centerOffset_z = -0.5 * (textGeo.boundingBox.max.z - textGeo.boundingBox.min.z);


	var textMesh1 = new THREE.Mesh(textGeo, material);

	textMesh1.position.x = centerOffset_x;
	textMesh1.position.y = centerOffset_y;
	textMesh1.position.z = centerOffset_z;

	textMesh1.rotation.x = 0;
	textMesh1.rotation.y = Math.PI * 2;

	group.add(textMesh1);
	texts.push(textMesh1);
}

function onDocumentMouseDown(event) {
	event.preventDefault();
	mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(objects);
	if (intersects.length > 0) {
		intersect = intersects[0].object;
		if ( event.button === 0 ) {
			if (intersect.state === GAMESTATE_DEFAULT && !intersect.isBomb) {
				// safe
				intersect.state = GAMESTATE_SAFE;
				intersect.bombNum = getBombNum(intersect);
				createText("" + intersect.bombNum, intersect.position);
				scene.remove( intersect );
			} else if (intersect.state === GAMESTATE_DEFAULT && intersect.isBomb) {
				// bomb
				intersect.state = GAMESTATE_BOMB;
				intersect.material.color = new THREE.Color(color_bomb);
			}
		} else if (event.button === 2){
			if (intersect.state === GAMESTATE_DEFAULT) {
				// lift flag
				intersect.state = GAMESTATE_DANGEROUS;
				intersect.material.color = new THREE.Color(color_dangerous);
			} else if (intersect.state === GAMESTATE_DANGEROUS){
				// init state
				intersect.state = GAMESTATE_DEFAULT;
				intersect.material.color = new THREE.Color(color_default);
			}
		}

	}
}

function getBombNum (mesh) {
	var bombNum = 0;
	var x_min = mesh.position_x - 1 >= 0 ? mesh.position_x - 1 : 0;
	var y_min = mesh.position_y - 1 >= 0 ? mesh.position_y - 1 : 0;
	var z_min = mesh.position_z - 1 >= 0 ? mesh.position_z - 1 : 0;
	var x_max = mesh.position_x + 1 < numberOfSphersPerSide ? mesh.position_x + 1 : numberOfSphersPerSide - 1;
	var y_max = mesh.position_y + 1 < numberOfSphersPerSide ? mesh.position_y + 1 : numberOfSphersPerSide - 1;
	var z_max = mesh.position_z + 1 < numberOfSphersPerSide ? mesh.position_z + 1 : numberOfSphersPerSide - 1;
	for (var i = x_min; i <= x_max; i++) {
		for (var j = y_min; j <= y_max; j++) {
			for (var k = z_min; k <= z_max; k++) {
				if (position_objects[i][j][k].isBomb) {
					bombNum++;
				}
			}
		}
	}
	return bombNum;
}

function render() {

	var timer = Date.now() * 0.00025;
	camera.lookAt(scene.position);
	for (var i = 0, l = objects.length; i < l; i++) {
		var object = objects[i];
		object.rotation.y += 0.005;
	}
	for(var i = 0, l = texts.length; i < l; i ++){
		texts[i].rotation.x = camera.rotation.x;
		texts[i].rotation.y = camera.rotation.y;
		texts[i].rotation.z = camera.rotation.z;
	}
	renderer.render(scene, camera);
}