import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import fontSrc from 'three/examples/fonts/helvetiker_bold.typeface.json?url'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { gsap } from 'gsap'
import { Vector3 } from 'three/src/math/Vector3'
import {
	GrannyKnot,
	CinquefoilKnot,
	TorusKnot,
	VivianiCurve,
	TrefoilPolynomialKnot,
	HelixCurve,
	DecoratedTorusKnot4b,
	HeartCurve,
	KnotCurve,
	TrefoilKnot,
} from 'three/examples/jsm/curves/CurveExtras'

// console.log(CurveExtras)

let D,
	projV,
	V = new THREE.Vector3(0, 0, 14),
	projD,
	steeringV = new THREE.Vector3(),
	steeringFactor = 25,
	minDistanceFire = 30,
	repulseV = new THREE.Vector3()

/**
 * Cursor
 */
const cursor = new THREE.Vector2()

const ammo = []

/**
 * Scene
 */
const scene = new THREE.Scene()

let font

/**
 * Manhattan
 */
const material = new THREE.MeshNormalMaterial({
	// wireframe: true,
})

const curve = new GrannyKnot()
// const curve = new THREE.CatmullRomCurve3(
// 	[
// 		new THREE.Vector3(-5, 3, 10),
// 		new THREE.Vector3(-5, 5, 5),
// 		new THREE.Vector3(0, 0, 0),
// 		new THREE.Vector3(5, -5, 5),
// 		new THREE.Vector3(10, 0, 10),
// 		new THREE.Vector3(5, 10, 8),
// 		new THREE.Vector3(0, 5, 15),
// 		new THREE.Vector3(-5, 2, 15),
// 	],
// 	true
// )

const tubeGeometry = new THREE.TubeGeometry(curve, 400, 0.1, 4, true)
// tubeGeometry.scale(0.5,0.54,)
const tubeMaterial = material.clone()
tubeMaterial.opacity = 0.3
tubeMaterial.transparent = true
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
scene.add(tube)

const geometry = new THREE.BoxGeometry(2, 2, 2)

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

mesh.add(new THREE.AxesHelper(1))
mesh.rotation.x = 0.35
mesh.rotation.y = 0.78

mesh.position.set(2, 3, -2)

const enemy = mesh.clone()
enemy.rotation.set(0, 0, 0)
enemy.position.set(1, 1, 5)
enemy.scale.setScalar(0.5)

// const cannon = enemy.clone()
// cannon.position.set(0, 0, 0.6)
// cannon.scale.set(0.2, 0.2, 1.5)
// enemy.add(cannon)

// console.log(mesh)
scene.add(enemy)

const axesHelper = new THREE.AxesHelper(4)
scene.add(axesHelper)

const gridHelper = new THREE.GridHelper(4, 4)
gridHelper.position.set(2, -0.01, 2)

scene.add(gridHelper)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}
/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)

camera.position.set(0, 20, 30)
// camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
renderer.setSize(sizes.width, sizes.height)

const pixelRatio = Math.min(window.devicePixelRatio, 2)
renderer.setPixelRatio(pixelRatio)
document.body.appendChild(renderer.domElement)

/**
 * OrbitControls
 */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(2, 1, 2)

const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	const delta = clock.getDelta()
	const time = clock.getElapsedTime()
	const loopTime = 35
	const t = (time % loopTime) / loopTime
	const t2 = ((time + 0.1) % loopTime) / loopTime

	const pos = tube.geometry.parameters.path.getPointAt(t)
	const pos2 = tube.geometry.parameters.path.getPointAt(t2)

	mesh.position.copy(pos)
	mesh.lookAt(pos2)

	controls.update()

	updateEnemy(delta)
	// createDArrow()
	// createProjVArrow()
	// createProjDArrow()

	renderer.render(scene, camera)

	ammo.forEach((ammo) => {
		ammo.position.addScaledVector(ammo.userData.vel, delta)
	})

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', onResize)

function onResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}

function createVector(
	name,
	v = new THREE.Vector3(),
	origin = new THREE.Vector3(),
	color
) {
	if (!color) {
		color = new THREE.Color(Math.random(), Math.random(), Math.random())
	}

	const h = new THREE.ArrowHelper(
		v.clone().normalize(),
		origin.clone(),
		v.length(),
		color.getHex(),
		0.3,
		0.2
	)

	const textPos = v.clone().multiplyScalar(0.65).add(origin)

	createText(name, textPos, color)
	scene.add(h)

	return h
}

const loader = new FontLoader()
loader.load(fontSrc, function (res) {
	font = res

	init()
})

function createText(text, position, color) {
	if (!text) return

	const geometry = new TextGeometry(text, {
		font,
		size: 0.3,
		height: 0.05,
	})

	geometry.computeBoundingBox()

	let mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: color.getHex(),
		})
	)

	console.log(geometry.boundingBox)

	mesh.position.copy(position)

	mesh.position.y += 0.2
	mesh.position.x -=
		(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2

	scene.add(mesh)
}

let enemyDirHelper, enemyDirProj, fireInterval

function getDVector() {
	const d = mesh.position.clone()
	d.sub(enemy.position)

	return d
}

function createDArrow() {
	// if (!font) return

	if (D) {
		scene.remove(D)
		D.dispose()
	}

	const d = getDVector()

	D = createVector('', d, enemy.position, new THREE.Color(0xfad451))
}

function updateRepulseV() {
	const d = getDVector().length()

	if (d < 6) {
		repulseV.copy(steeringV).negate()
		repulseV.multiplyScalar(6 - d).multiplyScalar(2)
	} else if (d > 15) {
		repulseV.set(0, 0, 0)
	}
}

function updateSteeringV() {
	const d = getDVector()

	const planeN = V.clone().normalize()
	// const plane = new THREE.Plane(planeN)

	d.projectOnPlane(planeN)
	d.normalize().multiplyScalar(steeringFactor)
	steeringV.copy(d)
}

function createProjDArrow() {
	if (projD) {
		scene.remove(projD)
		projD.dispose()
	}

	const d = getDVector()

	const planeN = V.clone().normalize()
	// const plane = new THREE.Plane(planeN)

	d.projectOnPlane(planeN)
	d.normalize()
	// steeringV.copy(d)

	d.multiplyScalar(2)

	projD = createVector('', d, enemy.position, new THREE.Color(0x56ff89))
}

function createProjVArrow() {
	// if(!font) return

	if (projV) {
		scene.remove(projV)
		projV.dispose()
	}

	const d = getDVector()

	const v = V.clone()

	v.projectOnVector(d)

	projV = createVector('', v, enemy.position, new THREE.Color(0x893451))
}

function updateEnemy(dt = 0) {
	// let vel = new Vector3(0, 0, 1)

	updateSteeringV()
	updateRepulseV()

	if (enemy) {
		V.addScaledVector(steeringV, dt)
		V.addScaledVector(repulseV, dt)
		V.normalize().multiplyScalar(16)
		const pos2 = enemy.position.clone().addScaledVector(V, dt)

		enemy.lookAt(pos2)
		enemy.position.copy(pos2)
		// enemy.rotation.x = Math.PI * 0.5 * cursor.y
		// enemy.rotation.y = -Math.PI * 0.5 * cursor.x
		// vel.transformDirection(enemy.matrixWorld)
	}

	if (true) {
		const enemyDir = new Vector3(0, 0, 1)
		enemyDir.transformDirection(enemy.matrixWorld)

		// enemyDirHelper.setDirection(vel)

		const d = getDVector()

		const dot = enemyDir.dot(d.normalize())
		console.log('dot:', dot)

		const v = enemyDir.clone().multiplyScalar(4)
		v.projectOnVector(d)

		// enemyDirProj.setLength(v.length())

		if (dot >= 0.995) {
			if (!fireInterval) {
				fire()
				fireInterval = setInterval(fire, 200)
			}
		} else {
			clearInterval(fireInterval)
			fireInterval = undefined
		}
	}
}

function init() {
	const v = new Vector3(0, 0, 1)
	v.transformDirection(mesh.matrixWorld).multiplyScalar(4)

	// createVector('', v, mesh.position)

	const enemyDir = new Vector3(0, 0, 1)
	enemyDir.transformDirection(enemy.matrixWorld).multiplyScalar(4)

	// enemyDirHelper = createVector('', enemyDir, enemy.position)

	const d = mesh.position.clone()
	d.sub(enemy.position)

	// D = createVector('D', d, enemy.position)

	// const proj = d.clone()
	// proj.normalize().multiplyScalar(4)
	// enemyDirProj = createVector('', proj, enemy.position)
}

window.addEventListener('mousemove', (e) => {
	cursor.x = 2 * (e.clientX / window.innerWidth) - 1
	cursor.y = -2 * (e.clientY / window.innerHeight) + 1
})

const ammoMaterial = new THREE.MeshNormalMaterial()

function fire() {
	const d = getDVector()
	if (d.length() > minDistanceFire) return

	const geometry = new THREE.IcosahedronGeometry(0.2, 1)

	const mesh = new THREE.Mesh(geometry, ammoMaterial)
	mesh.position.copy(enemy.position)

	mesh.userData.vel = new Vector3(0, 0, 1)
	mesh.userData.vel
		.transformDirection(enemy.matrixWorld)
		.multiplyScalar(80 + V.length())

	scene.add(mesh)
	ammo.push(mesh)
}

// window.addEventListener('click', fire)
