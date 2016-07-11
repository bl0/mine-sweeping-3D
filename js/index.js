if (!Detector.webgl) Detector.addGetWebGLMessage();
var container, stats;
var camera, scene, renderer, controls, objects = [];
var particleLight;
var loader = new THREE.FontLoader();
loader.load('fonts/gentilis_regular.typeface.json', function(font) {
	init(font);
	animate();
});

function init(font) {
	container = document.createElement('div');
	document.body.appendChild(container);
	camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 2000);
	camera.position.set(0.0, 400, 400 * 3.5);
	//
	var reflectionCube = new THREE.CubeTextureLoader()
		.setPath('textures/cube/SwedishRoyalCastle/')
		.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
	reflectionCube.format = THREE.RGBFormat;
	scene = new THREE.Scene();
	scene.background = reflectionCube;
	// Materials
	var imgTexture = new THREE.TextureLoader().load("textures/planets/moon_1024.jpg");
	imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
	imgTexture.anisotropy = 16;
	imgTexture = null;
	var shininess = 50,
		specular = 0x333333,
		shading = THREE.SmoothShading;
	var materials = [];
	var cubeWidth = 400;
	var numberOfSphersPerSide = 5;
	var sphereRadius = (cubeWidth / numberOfSphersPerSide) * 0.8 * 0.5;
	var stepSize = 1.0 / numberOfSphersPerSide;
	var geometry = new THREE.SphereBufferGeometry(sphereRadius, 32, 16);
	for (var alpha = 0; alpha <= 1.0; alpha += stepSize) {
		var baseColor = new THREE.Color().setHSL(alpha, 0.5, 0.5);
		if (alpha >= 0.5) {
			reflectionCube = null;
		}
		for (var beta = 0; beta <= 1.0; beta += stepSize) {
			var reflectivity = beta;
			for (var gamma = 0; gamma <= 1.0; gamma += stepSize) {
				var diffuseColor = baseColor.clone().multiplyScalar(gamma);
				var material = new THREE.MeshBasicMaterial({
					map: imgTexture,
					color: diffuseColor,
					reflectivity: reflectivity,
					shading: THREE.SmoothShading,
					envMap: reflectionCube
				})
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.x = alpha * 400 - 200;
				mesh.position.y = beta * 400 - 200;
				mesh.position.z = gamma * 400 - 200;
				objects.push(mesh);
				scene.add(mesh);
			}
		}
	}

	function addLabel(name, location) {
		var textGeo = new THREE.TextGeometry(name, {
			font: font,
			size: 20,
			height: 1,
			curveSegments: 1
		});
		var textMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff
		});
		var textMesh = new THREE.Mesh(textGeo, textMaterial);
		textMesh.position.copy(location);
		scene.add(textMesh);
	}
	//
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
	window.addEventListener('resize', onWindowResize, false);
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

function render() {
	var timer = Date.now() * 0.00025;
	camera.lookAt(scene.position);
	for (var i = 0, l = objects.length; i < l; i++) {
		var object = objects[i];
		object.rotation.y += 0.005;
	}
	renderer.render(scene, camera);
}