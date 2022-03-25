import * as THREE from '../build/three.module.js'
import { degreesToRadians } from '../libs/util/util.js'

// Auxiliares na rotacao:
var angleRotHori = degreesToRadians(0.4)        
var angleHori = degreesToRadians(0.5)
var angleVert = degreesToRadians(0.4)
var auxRotVertical = 0                   
var auxRotHorizontal = 0       
var speedHorEsq = 0   
var speedHorDir = 0     
var speedVertC = 0
var speedVertB = 0   


// Movimento direcional
export function esquerda(esferaMov, esferaHelice, esferaCam, speed) {
  if(speed > 1) {                             // Movimento somente se houver aceleracao
    if (speed > 0) {
      if (auxRotHorizontal < 80) {
        esferaMov.rotation.z -= angleRotHori // Rotaciona o aviao para os lados
        auxRotHorizontal++ // Auxiliar para nivelamento
      }
      if (speedHorEsq <= 1) {
        esferaHelice.rotation.y += angleHori * speedHorEsq * speed/4
        esferaCam.rotation.y += angleHori * speedHorEsq * speed/4
        speedHorDir = 0
        speedHorEsq += 0.05
      } 
      else {
        esferaHelice.rotation.y += angleHori * speed/4
        esferaCam.rotation.y += angleHori * speed/4
      }
    }
  }   
}
export function direita(esferaMov, esferaHelice, esferaCam, speed) {
  if (speed > 1) {
    if (auxRotHorizontal > -80 ) {
      esferaMov.rotation.z += angleRotHori
      auxRotHorizontal--
    }
    if (speedHorDir <= 1) {
      esferaHelice.rotation.y -= angleHori * speedHorDir * speed/4
      esferaCam.rotation.y -= angleHori * speedHorDir * speed/4
      speedHorEsq = 0
      speedHorDir += 0.05
    } 
    else {
      esferaHelice.rotation.y -= angleHori * speed/4
      esferaCam.rotation.y -= angleHori * speed/4
    }
  }
}
export function cima(esferaHelice, esferaMov, speed) {
  if(speed > 1) {  
    if (auxRotVertical > -60) {
      esferaMov.rotation.x += angleVert // Movimenta para cima com a rotação
      auxRotVertical-- // Auxiliar para nivelamento
    }
    if(speedVertC > -1){
      speedVertC -= 0.05
    }
    esferaHelice.translateY( (speed/3) * speedVertC )
  }
}
export function baixo(esferaHelice, esferaMov, speed){ 
  if (speed > 1) {
    if (auxRotVertical < 60) {
      esferaMov.rotation.x -= angleVert
      auxRotVertical++
    }
    if(speedVertB < 1){
      speedVertB += 0.05
    }
    esferaHelice.translateY( (speed/3) * speedVertB )
  }
}

export function nivelamento (esferaHelice, esferaCam, esferaMov, nivV, nivH, speed){
  if (nivV){
    if (auxRotVertical > 0 ){ //nivBaixo
      esferaMov.rotation.x += angleVert
      auxRotVertical--
      if (speedVertB > 0){
        esferaHelice.translateY( speedVertB * (speed/2))
        speedVertB -= 0.02
      }
    } else if (auxRotVertical < 0){ //nivCima
      esferaMov.rotation.x -= angleVert // Nivela aviao
      auxRotVertical++
      if (speedVertC < 0){
        esferaHelice.translateY( speedVertC * (speed/2) )
        speedVertC += 0.02
      }
    } else if (auxRotVertical == 0){
      speedVertB = 0
      speedVertC = 0
    }
  }
  if(nivH){
    if (auxRotHorizontal < 0){ // nivDir
      esferaMov.rotation.z -= angleRotHori
      esferaHelice.rotation.y -= angleHori * speedHorDir * speed/4
      esferaCam.rotation.y -= angleHori * speedHorDir  * speed/4
      if (speedHorDir > 0) 
        speedHorDir -= 0.02
      auxRotHorizontal++
    }
    else if (auxRotHorizontal > 0){ //nivEsq
      esferaMov.rotation.z += angleRotHori 
      esferaHelice.rotation.y += angleHori * speedHorEsq * speed/4
      esferaCam.rotation.y += angleHori * speedHorEsq * speed/4
      if (speedHorEsq > 0) 
        speedHorEsq -= 0.02
      auxRotHorizontal-- 
    }
    else if(auxRotHorizontal == 0){
      speedHorDir = 0
      speedHorEsq = 0
    }
  }
}

// Recupera angulos apos trocas de modo de camera
var movx = 0
var movy = 0
var movz = 0
var helx = 0
var hely = 0
var helz = 0
export function forceNiv(esferaHelice, esferaMov) {  
  movx = esferaMov.rotation.x
  movy = esferaMov.rotation.y
  movz = esferaMov.rotation.z
  helx = esferaHelice.rotation.x 
  hely = esferaHelice.rotation.y     
  helz = esferaHelice.rotation.z 
  esferaMov.rotation.x = 0  
  esferaMov.rotation.y = 0  
  esferaMov.rotation.z = 0     
  esferaHelice.rotation.x = 0
  esferaHelice.rotation.y = 0
  esferaHelice.rotation.z = 0                                      
}
export function restoreNiv(esferaHelice, esferaMov) {   
  esferaMov.rotation.x = movx
  esferaMov.rotation.y = movy                     
  esferaMov.rotation.z = movz  
  esferaHelice.rotation.x = helx
  esferaHelice.rotation.y = hely 
  esferaHelice.rotation.z = helz                        
}