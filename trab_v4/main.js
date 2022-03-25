import * as THREE from '../build/three.module.js'
import Stats from '../build/jsm/libs/stats.module.js'
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js'
import KeyboardState from '../libs/util/KeyboardState.js'
import {
  initRenderer,
  initCamera,
  InfoBox,
  onWindowResize,
  degreesToRadians,
  createGroundPlane,
  radiansToDegrees,
  SecondaryBox,
} from '../libs/util/util.js'
import {
  criaAviao,
  getEsferaHelice,
  getEsferaMov,
  rotatePlaneComponents,
} from './aviao.js'
import {
  esquerda,
  direita,
  cima,
  baixo,
  forceNiv,
  restoreNiv,
  nivelamento,
} from './movimento.js'
import {
  addTrajeto,
  checkpoint,
  getCont,
  getDist,
  getStart,
  circuitoFull
} from './circuito.js'
import { addMontanhas } from './montanha.js'
import {
  addArvores,
  showEnvironmentObjects,
  hideEnvironmentObjects,
} from './arvore.js'
import { loadGLTFFile } from './externalObject.js'
import { createCity } from './cidade.js'
import { createPeriferia } from './periferia.js'

var scene = new THREE.Scene() // Create main scene
var renderer = initRenderer() // View function in util/utils

function createStats() {
  var stats = new Stats();
  stats.setMode(0);

  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0';
  stats.domElement.style.top = '0';
  return stats;
}
var stats = createStats();
document.body.appendChild( stats.domElement );

// ---------------- LoadScreen ---------------- //

var LoadingManager = new THREE.LoadingManager()

var loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(90,1200/720,0.1,100),
  box: new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 0.1))
}


var LOADING_MANAGER = null;
var RESOURCES_LOADED = false; // trocar para n ter tela de load
var textLoad = new THREE.TextureLoader()
var textStart = textLoad.load('Images/Floor/Start.jpg')
loadingScreen.box.position.set(0, 0, 5)
loadingScreen.box.material.map = textStart
loadingScreen.camera.lookAt(loadingScreen.box.position)


// ---------------- Planos ---------------- //
var plane = createGroundPlane(10000, 10000, 100, 100)
plane.rotateX(degreesToRadians(-90))
plane.translateX(1000).translateZ(-5)

var planeExt = createGroundPlane(90000, 90000, 100, 100, '#616161')
scene.add(planeExt)
planeExt.rotateX(degreesToRadians(90)).translateZ(30)

var textureLoader = new THREE.TextureLoader(LoadingManager)
var planeText = textureLoader.load('Images/Floor/Text1.jpg')

plane.material.map = planeText
plane.material.map.repeat.set(50, 50)
plane.material.map.wrapS = THREE.RepeatWrapping
plane.material.map.wrapT = THREE.RepeatWrapping
plane.material.map.minFilter = THREE.LinearFilter
plane.material.map.magFilter = THREE.LinearFilter

// ---------------- Ambiente ---------------- //
// Iluminação
const ambientLight = new THREE.HemisphereLight(0xcccccc, 0x111111, 0.7)
scene.add(ambientLight)

// Sol
const sunPosition = new THREE.Vector3(0, 2000, -2000)

// Criando o spotLight do sol
var sunLight = new THREE.SpotLight('rgb(255,200,100)')
sunLight.intensity = 1.5
sunLight.position.copy(sunPosition)
sunLight.distance = 0
sunLight.castShadow = true
sunLight.decay = 2
sunLight.penumbra = 1
sunLight.angle = degreesToRadians(110)
sunLight.shadow.mapSize.width = 4000
sunLight.shadow.mapSize.height = 4000
sunLight.shadow.camera.fov = radiansToDegrees(sunLight.angle)
sunLight.shadow.camera.far = 7000.0
sunLight.shadow.camera.near = 0.2

scene.add(sunLight)

// Criando o spotLight dinâmico para o avião
var planeLight = new THREE.SpotLight('rgb(255,200,100)')
planeLight.intensity = 0
planeLight.position.set(new THREE.Vector3(0, 0, 0))
planeLight.castShadow = true
planeLight.angle = degreesToRadians(120)
planeLight.shadow.mapSize.width = 2000
planeLight.shadow.mapSize.height = 2000
planeLight.shadow.camera.fov = radiansToDegrees(planeLight.angle)
planeLight.shadow.camera.far = 300.0
planeLight.shadow.camera.near = 0.01
planeLight.shadow.autoUpdate = true

scene.add(planeLight)

//Luz para a câmera de inspeção
var inspectionLight = new THREE.SpotLight('rgb(255,136,0)')
inspectionLight.intensity = 1
inspectionLight.position.copy(new THREE.Vector3(0, 20, 60))
inspectionLight.distance = 0
inspectionLight.castShadow = false
inspectionLight.decay = 2
inspectionLight.penumbra = 0
inspectionLight.angle = degreesToRadians(110)
inspectionLight.shadow.mapSize.width = 0
inspectionLight.shadow.mapSize.height = 0
inspectionLight.shadow.camera.fov = radiansToDegrees(inspectionLight.angle)
inspectionLight.shadow.camera.far = 20.0
inspectionLight.shadow.camera.near = 0.2

// -------------- Objeto Externo ------------ //
loadGLTFFile(
  './Objects/',
  'scene',
  320.0,
  1090,
  1500,
  scene,
  LoadingManager
)

// ------------------ Cidade --------------- //

createCity(scene, LoadingManager)
createPeriferia(scene, LoadingManager)

addMontanhas(scene)
// Árvores
addArvores(scene)

// ----------------- Circuito --------------- //

// Ativa/desativa trajeto
var trajOn = true
var trajeto = addTrajeto()
function switchTrajeto() {
  if (trajOn) {
    scene.add(trajeto)
    trajOn = false
  } else {
    scene.remove(trajeto)
    trajOn = true
  }
}
switchTrajeto()

//circuitoFull(scene)

// Tempo
var contadorCP = 0
var distancia = 0
var start = 0
var duracao = 0
var auxt = 0
var auxduracao = 0
var auxTempoModoCam = 0
function getCircuito() {
  contadorCP = getCont()
  distancia = getDist()
  if (contadorCP > 0 && contadorCP < 15 && !modoCam) {
    start = getStart()
    duracao = new Date().getTime() - start - auxTempoModoCam
  }
  // Calcula tempo no modo de camera inspecao, para ser desconsiderado
  else if (contadorCP > 0 && contadorCP < 15 && modoCam) {
    auxduracao = new Date().getTime() - auxt
  }
}

// ----------------- Aviao ----------------- //
var posX = 1001
var posY = 10
var posZ = -3700
criaAviao(scene, posX, posY, posZ)
var esferaHelice = getEsferaHelice()
var esferaMov = getEsferaMov()

// ---------------- Movimento ----------------- //
// Variaveis de posicao
var speed = 0
var auxSpeed = 0
var position = new THREE.Vector3()
var subiu = false
var mAce = false

// Movimento de aceleracao
function aceleracao() {
  if (!modoCam) {
    if (speed > 0) esferaHelice.translateZ(speed) // Movimento para frente
  }
}
function acelera() {
  if (!modoCam) {
    if (speed < 3) 
      speed += 0.005 
    if (speed > 0.5)
      subiu = true
  }
}
function desacelera() {
  if (!modoCam) 
    if (speed > 0) 
      speed -= 0.005
}

function getPosition() {
  // salva posição do aviao
  scene.updateMatrixWorld(true)
  position.setFromMatrixPosition(esferaHelice.matrixWorld) // Vetor posicao
  posX = position.x
  posY = position.y
  posZ = position.z
}



//Nivelamento
var nivV = false
var nivH = false

// ----------------- Camera ----------------- //
var axesHelper = new THREE.AxesHelper(12)

var pX = posX
var pY = posY
var pZ = posZ
var pHolder = new THREE.Vector3()
var holderGeo = new THREE.SphereGeometry(0.01, 0.01, 1)
var holderMat = new THREE.MeshBasicMaterial({ color: 0xff1803 })
var esferaCam = new THREE.Mesh(holderGeo, holderMat) // Objeto que carrega a cammera
scene.add(esferaCam)
esferaCam.position.set(pX, pY, pZ) // Posiciona objeto no centro do aviao

function posicaoHolder() {
  scene.updateMatrixWorld(true)
  pHolder.setFromMatrixPosition(esferaHelice.matrixWorld) // Vetor posicao
  pX = pHolder.x
  pY = pHolder.y
  pZ = pHolder.z
  esferaCam.position.set(pX, pY, pZ)
}

// Camera para o modo Simulacao
var cameraSimulation = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  90000
)
cameraSimulation.position.copy(new THREE.Vector3(0, 40, -150))
cameraSimulation.lookAt(new THREE.Vector3(0, 0, 0))

// Camera para o modo Inspecao
var cameraInspection = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  120
)
cameraInspection.position.copy(new THREE.Vector3(0, 20, 60))
cameraInspection.lookAt(new THREE.Vector3(0, 0, 0))
var camera = cameraSimulation
var clear = initCamera(new THREE.Vector3(0, 0, 0)) // Usada apenas para limpar o trackball
var trackballControls = new TrackballControls(clear, renderer.domElement)
var modoCam = true // Auxilia na selecao da camera

esferaCam.add(camera)

//Funcao para a troca do modo de camera
function switchCam() {
  if (modoCam) {
    auxTempoModoCam += auxduracao // Usado para calcular tempo a ser diminuido do modo inspecao
    scene.add(plane)
    scene.add(planeExt)
    scene.add(sunLight)
    scene.remove(axesHelper)
    trackballControls = new TrackballControls(clear, renderer.domElement) // Remove o trackball
    esferaHelice.position.set(posX, posY, posZ) // Posiciona na posicao anterior salva
    showEnvironmentObjects(scene) // Recoloca arvores da cena
    if (modoCockpit) {
      camera = cameraSimulation
      esferaCam.add(camera)
    } else {
      camera = camCockpit
      cockpit.add(camera)
    }
    scene.remove(inspectionLight)
    restoreNiv(esferaHelice, esferaMov) // Restaura angulos de inclinacao
    nivV = true
    nivH = true
    modoCam = false // Auxilia modo da camera
    speed = auxSpeed // Restaura velocidade
    if (mAce) acelera()
    else desacelera()
  } else {
    auxt = new Date().getTime() // Usado para calcular tempo no modo inspeçao
    nivV = false
    nivH = false
    getPosition() // Salva a posicao
    auxSpeed = speed // Salva velocidade
    speed = 0 // Interrompe o movimento
    scene.add(axesHelper)
    scene.remove(plane)
    scene.remove(planeExt)
    scene.remove(sunLight)
    scene.add(inspectionLight)
    hideEnvironmentObjects(scene) // Esconde arvores da cena
    forceNiv(esferaHelice, esferaMov) // Forca nivelamento instantaneo
    camera = cameraInspection // Troca camera
    trackballControls = new TrackballControls(camera, renderer.domElement) // Add trackball
    esferaHelice.position.set(0, 0, 0) // Posiciona aviao no centro do mundo deslocando para baixo
    esferaHelice.translateZ(25)
    modoCam = true
  }
}

// God Mode
var godOn = true
godMode()
function godMode() {
  if (godOn) {
    camera = cameraSimulation
    godOn = false
  } else {
    var camGod = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      90000
    )
    camGod.position.copy(esferaCam.position)
    camGod.lookAt(new THREE.Vector3(0, 0, 0))
    camera = camGod
    godOn = true
  }
}

function switchKeyboardUpdate() {
  if (!godOn) keyboardUpdate()
  else godKeyUp()
}

function godKeyUp() {
  keyboard.update()
  if (keyboard.down('G')) godMode()

  if (keyboard.pressed('W')) camera.translateZ(-3)
  else if (keyboard.pressed('S')) camera.translateZ(3)
  else if (keyboard.pressed('space')) camera.translateZ(-10)

  if (keyboard.pressed('A')) camera.translateX(-3)
  else if (keyboard.pressed('D')) camera.translateX(3)
  if (keyboard.pressed('up')) camera.rotateX(degreesToRadians(0.5))
  else if (keyboard.pressed('down')) camera.rotateX(degreesToRadians(-0.5))

  if (keyboard.pressed('left')) camera.rotateY(degreesToRadians(0.5))
  else if (keyboard.pressed('right')) camera.rotateY(degreesToRadians(-0.5))

  if (keyboard.pressed('Q')) camera.translateY(-2)
  else if (keyboard.pressed('E')) camera.translateY(2)
}

function getPTeste() { // Para testes
  var tx, ty, tz
  var testP = new THREE.Vector3()
  scene.updateMatrixWorld(true)
  testP.setFromMatrixPosition(camera.matrixWorld) // Vetor posicao
  tx = testP.x
  ty = testP.y
  tz = testP.z
  console.log("x:",tx," y:",ty, " z:",tz)
}

// Cockpit
var cockpit = new THREE.Mesh(holderGeo, holderMat)
esferaMov.add(cockpit)

var camCockpit = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  90000
)
camCockpit.position.copy(new THREE.Vector3(0, 7, -15))
camCockpit.lookAt(new THREE.Vector3(0, 5, 0))

var modoCockpit = true
function switchCockpit() {
  if (modoCockpit) {
    camera = camCockpit
    cockpit.add(camera)
    modoCockpit = false
  } else {
    camera = cameraSimulation
    esferaCam.add(camera)
    modoCockpit = true
  }
}

switchCam()
// --------------------------- Audio---------------------------------- //
var listener = new THREE.AudioListener()
esferaCam.add(listener)
var listener2 = new THREE.AudioListener()
esferaCam.add(listener2)

//Music
var sound = new THREE.Audio(listener)
var audioLoader = new THREE.AudioLoader()
audioLoader.load('Sounds/SWsound.mp3', function (buffer) {
  sound.setBuffer(buffer)
  sound.setLoop(true)
  sound.setVolume(0.1)
  sound.play()
})

//Airplane
var sound2 = new THREE.Audio(listener)
var audioLoader2 = new THREE.AudioLoader()
audioLoader2.load('Sounds/Airplane.mp3', function (buffer) {
  sound2.setBuffer(buffer)
  sound2.setLoop(true)
  sound2.setVolume((0.1 * speed) / 3)
  sound2.play()
})
function airplaneAudio() {
  sound2.setVolume((0.1 * speed) / 3)
}

// --------------------------- Skybox ---------------------------------- //

let textSky = []
let texture_ft = new THREE.TextureLoader().load('Images/Skybox/sw_ft.png')
let texture_bk = new THREE.TextureLoader().load('Images/Skybox/sw_bk.png')
let texture_up = new THREE.TextureLoader().load('Images/Skybox/sw_up.png')
let texture_dn = new THREE.TextureLoader().load('Images/Skybox/sw_dn.png')
let texture_rt = new THREE.TextureLoader().load('Images/Skybox/sw_rt.png')
let texture_lf = new THREE.TextureLoader().load('Images/Skybox/sw_lf.png')

textSky.push(new THREE.MeshBasicMaterial({ map: texture_ft }))
textSky.push(new THREE.MeshBasicMaterial({ map: texture_bk }))
textSky.push(new THREE.MeshBasicMaterial({ map: texture_up }))
textSky.push(new THREE.MeshBasicMaterial({ map: texture_dn }))
textSky.push(new THREE.MeshBasicMaterial({ map: texture_rt }))
textSky.push(new THREE.MeshBasicMaterial({ map: texture_lf }))

for (let i = 0; i < 6; i++) textSky[i].side = THREE.BackSide

let skyboxGeo = new THREE.BoxGeometry(90000, 90000, 90000)
let skybox = new THREE.Mesh(skyboxGeo, textSky)
scene.add(skybox)

// --------------------------- Keyboard---------------------------------- //

var vD = false
var vU = false
var vL = false
var vR = false

var keyboard = new KeyboardState()

function keyboardUpdate() {
  keyboard.update()
  if (!modoCam) {
    if (keyboard.pressed('down')) baixo(esferaHelice, esferaMov, speed, subiu)
    if (keyboard.down('down')) {
      vD = true
      nivV = false
    }
    if (keyboard.up('down')) {
      vD = false
      if (!vU) nivV = true
    }

    if (keyboard.pressed('up')) cima(esferaHelice, esferaMov, speed, subiu)
    if (keyboard.down('up')) {
      vU = true
      nivV = false
    }
    if (keyboard.up('up')) {
      vU = false
      if (!vD) nivV = true
    }

    if (keyboard.pressed('left'))
      esquerda(esferaMov, esferaHelice, esferaCam, speed, subiu)
    if (keyboard.down('left')) {
      vL = true
      nivH = false
    }
    if (keyboard.up('left')) {
      vL = false
      if (!vR) nivH = true
    }

    if (keyboard.pressed('right'))
      direita(esferaMov, esferaHelice, esferaCam, speed, subiu)
    if (keyboard.down('right')) {
      vR = true
      nivH = false
    }
    if (keyboard.up('right')) {
      vR = false
      if (!vL) nivH = true
    }
    if (keyboard.pressed('Q')) acelera()
    else if (keyboard.pressed('A')) desacelera()
    if (keyboard.down('C')) switchCockpit()
    if (keyboard.down('R')) document.location.reload(true)
    if (keyboard.down('H')) switchControls()
    if (keyboard.down('enter')) switchTrajeto()
    //if (keyboard.down('T')) getPTeste() // usado para testes
    //if (keyboard.down('G')) godMode()
  }
  if (keyboard.down('space')) switchCam()
}

// Informacoes na tela
var showControls = false
var controls = new InfoBox()

switchControls()

function switchControls() {
  if (showControls) {
    controls.infoBox.style.backgroundColor = 'rgba(255,255,255,0)'
    controls.infoBox.innerHTML = ''
    showControls = false
  } else {
    controls.infoBox.style.backgroundColor = 'rgba(255,255,255,0.2)'
    controls.infoBox.innerHTML = `Instruções:<br/>
    Use H para esconder instruções<br/>
    Use SPACE para mudar o modo<br/>
    Use R para reiniciar<br/>
    <br/>
    Modo 1: Simulador<br/>
    * Segure Q para acelerar<br/>
    * Segure A para desacelerar<br/>
    * Setas para direcionar<br/>
    * C para modo cockpit<br/>
    * ENTER para trajeto on/off<br/>
    <br/>
    Modo 2: Visualização<br/>
    * Utilize o mouse para rotacionar`
    showControls = true
  }
}

// Listen window size changes
window.addEventListener(
  'resize',
  function () {
    onWindowResize(camera, renderer)
  },
  false
)

var timerMessage = new SecondaryBox('')
var cont = 0
render()

const load = document.getElementById('load')

function loading() {
  LoadingManager.onProgress = function (item, loaded, total) {
    load.innerHTML ='Loading<br/>' + ((parseInt(loaded) * 100) / total).toFixed(2) + '%'
  }

  LoadingManager.onLoad = function () {
    auxLoading()
    requestAnimationFrame(auxLoading)
    return
  }
}

function auxLoading(){
  loadingScreen.scene.add(loadingScreen.box)
  keyboard.update();
  if(keyboard.down('space')) {
    RESOURCES_LOADED = true
    load.innerHTML = ''
    console.log('Start')
    controls.show()
    RESOURCES_LOADED = true
    requestAnimationFrame(render)
  }
  requestAnimationFrame(auxLoading)
}

function render() {
  if (RESOURCES_LOADED == false) {
    loading()
    requestAnimationFrame(render)

    loadingScreen.box.position.x -= 0.02
    if (loadingScreen.box.position.x < -10) loadingScreen.box.position.x = 10
    loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x)

    renderer.render(loadingScreen.scene, loadingScreen.camera)
    return
  }

  if (!modoCam) {
    timerMessage.changeMessage(
      `Tempo: ${(duracao / 1000).toFixed(2)}
      - CheckPoint: ${contadorCP}/15 
      - Distancia até o próximo: ${distancia.toFixed(0)}`
    )
    planeLight.position.copy(esferaHelice.position)
    planeLight.translateY(70).translateX(90)
  } else timerMessage.changeMessage('')
  if (cont > 50) {
    sunLight.shadow.autoUpdate = false
    cont = 2
  } else {
    cont += 1 
  }
  scene.add(planeLight.target)
  stats.update()
  trackballControls.update()
  switchKeyboardUpdate()
  getCircuito() // contadores do circuito
  aceleracao()
  nivelamento(esferaHelice, esferaCam, esferaMov, nivV, nivH, speed)
  posicaoHolder() // atualiza posicao do holder
  checkpoint(scene, pX, pY, pZ, listener2) // calcula colisao com checkpoint
  rotatePlaneComponents()
  airplaneAudio()
  requestAnimationFrame(render)
  inspectionLight.position.copy(cameraInspection.position)
  renderer.render(scene, camera) // Render scene
}
