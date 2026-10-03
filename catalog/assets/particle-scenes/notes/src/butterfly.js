import * as THREE from 'three';
import {createButterflyGeometry} from '../vendor/lunar-butterfly-geometry';

// The solid cream silhouette is the existing 月亮穿梭 butterfly, not a new design.
// Its native +Y heading is mapped to score +X so it travels along the notes.
export async function loadButterflyAssets(){return null;}

export function createButterfly(color,assets,index=0){
 const root=new THREE.Group();root.name='lunar-note-butterfly';root.scale.setScalar(.62);
 const shapes=createButterflyGeometry(THREE),materials=[];
 const cream=new THREE.Color('#fcf9d8').lerp(new THREE.Color(color),.10);
 const fill=new THREE.MeshBasicMaterial({color:cream,side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false});
 const detail=new THREE.MeshBasicMaterial({color:cream,transparent:true,depthWrite:false,toneMapped:false});
 materials.push(fill,detail);
 // Keep the source's filled wings: its optional vein/outline overlays stay absent.
 shapes.veinGeometry.dispose();shapes.edgeGeometry.dispose();
 const specimen=new THREE.Group();specimen.scale.setScalar(2.45);
 specimen.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0)
 ));
 root.add(specimen);
 const wings=[];
 for(const sign of [1,-1]){
  const hinge=new THREE.Group(),mesh=new THREE.Mesh(shapes.wingGeometry,fill);
  mesh.scale.x=sign;mesh.renderOrder=5;hinge.add(mesh);specimen.add(hinge);
  wings.push({hinge,sign});
 }
 const body=new THREE.Mesh(shapes.bodyGeometry,detail);body.renderOrder=6;specimen.add(body);
 // Turn the source's delicate curved antennae into narrow, camera-independent tubes.
 const antennaPosition=shapes.antennaGeometry.getAttribute('position');
 const antennaParts=[];
 for(let half=0;half<2;half++){
  const points=[],start=half*76;
  for(let j=0;j<76;j+=2)points.push(new THREE.Vector3().fromBufferAttribute(antennaPosition,start+j));
  points.push(new THREE.Vector3().fromBufferAttribute(antennaPosition,start+75));
  const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.006,4,false);
  const antenna=new THREE.Mesh(geometry,detail);antenna.renderOrder=6;specimen.add(antenna);antennaParts.push(geometry);
 }
 shapes.antennaGeometry.dispose();
 function animate(t,alpha,bank,camera,state){
  // The wing clock never restarts at a note. A faster downstroke and slower
  // recovery, with slight left/right lag, read as flight instead of a hop.
  const beat=t*Math.PI*2*2.4+index*.65;
  const pulse=Math.sin(beat)+.16*Math.sin(beat*2);
  for(const {hinge,sign}of wings){
   const lag=sign*.06*Math.sin(beat+.4);
   hinge.rotation.y=-sign*(.68+.54*pulse+lag);
  }
  specimen.position.y=.27+.025*Math.sin(beat-.4);
  root.rotation.set(0,-(state?.heading??0),.07*Math.sin(t*2.1+index)+.025*Math.cos(beat));
  root.rotation.x=.07*Math.sin(t*1.7+index*.8);
  for(const material of materials)material.opacity=alpha;
  root.visible=alpha>.001;
 }
 animate(0,0,0,null,{phase:0,stepIndex:0,grounded:true});
 return{root,wings,animate,dispose(){
  shapes.wingGeometry.dispose();shapes.bodyGeometry.dispose();
  for(const geometry of antennaParts)geometry.dispose();
  for(const material of materials)material.dispose();
 }};
}
