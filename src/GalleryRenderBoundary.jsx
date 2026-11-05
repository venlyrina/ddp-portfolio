import {Component} from 'react';

// The stellar corridor must survive a failed optional image/overlay renderer.
// React render errors in the gallery should never unmount the 3D dust layer.
export default class GalleryRenderBoundary extends Component{
 constructor(props){super(props);this.state={failed:false}}
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error,info){
  console.error('[VENSHALOR] Gallery overlay recovered; dust corridor remains active',error,info);
 }
 render(){
  if(this.state.failed)return <div className="corridor-render-recovery" role="status">
   GALLERY LAYER UNAVAILABLE / SPACE REMAINS ACTIVE
   <button type="button" onClick={()=>this.setState({failed:false})}>RETRY GALLERY</button>
  </div>;
  return this.props.children;
 }
}
