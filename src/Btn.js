import React, {Component} from 'react';
//import { CsvToHtmlTable } from 'react-csv-to-table';
import M from 'materialize-css';
import 'react-table/react-table.css'
import Papa from 'papaparse/papaparse.min.js';
import ReactTable from 'react-table'
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import HeatmapLayer from 'react-leaflet-heatmap-layer';
import { AntPath, antPath } from 'leaflet-ant-path';
import _ from 'lodash';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});
const greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
//const options = { use: L.polyline, delay: 400, dashArray: [10,20], weight: 5, color: "#0000FF", pulseColor: "#FFFFFF" };
//const addressPoints = [[12.9, 77.6, 300],[13, 77, 10]];
const gradient = {
  0.1: '#89BDE0', 0.2: '#96E3E6', 0.4: '#82CEB6',
  0.6: '#FAF3A5', 0.8: '#F5D98B', 1.0: '#DE9A96'
};

// ref can only be used on class components
class Task extends Component {
  // get a reference to the element after the component has mounted
  constructor(){
    super();
    this.state = {
    	// json data for i/p to react-tables 
      jsondata: [],
      // column headers for i/p to react-tables
      columns: [],
      // source coordinates array. For ReactHeatmap  
      sourceAddressPoints: [],
      // destination coordinatesarray. For ReactHeatmap
      destAddressPoints: [],
      // center for ReactLeaflet Map
      center: null,
      // source coordinates. TO-DO: expand to array of sources to plot bunch of rows
      from: [0,0],
      // destination coordinates. TO-DO: expand to array of destinations to plot bunch of rows
      to: [0,0],
      // store selected row
      selected: null,
      // if HeatMap Layer is hidden or not
      sourceLayerHidden: true,
      destLayerHidden: true,
      // if Markers are present or not
      showFromMarker: false,
      showToMarker: false
    };
  };

  componentDidMount(){
    M.AutoInit();
  }

  handleFileChosen = (file) => {
  	let fr = new FileReader();
  	fr.onloadend = () => {
  		let result = Papa.parse(fr.result, {
     		header: true,
     		skipEmptyLines: true,
    	}); 
  		this.setState({
  			jsondata: result.data, 
  			columns: result.meta.fields.map(x => ({Header : x, accessor: x}))
  		});
  	}
  	fr.readAsText(file);
  }

  handleSourceHeatMap = () => {
  	console.log("heat")
  	if(this.state.sourceLayerHidden==false){
  		this.setState({sourceLayerHidden: true})
  	}
  	else if(this.state.jsondata.length>0){
  		console.log(this.state.jsondata)
  		let inter = this.state.jsondata.filter(x => x.from_lat!="NULL"&&x.from_long!="NULL")
	  	let center
	  	inter = inter.map(x => [x.from_lat,x.from_long])
	  	inter = _.countBy(inter)
	  	inter = Object.keys(inter).map(x => [parseFloat(x.split(",")[0]), parseFloat(x.split(",")[1]), parseFloat(inter[x])])
	  	center =  inter.reduce((total=[0,0], value) => [total[0]+value[0], total[1]+value[1]])
	  	center = center.map(x => x/inter.length)	
	  	console.log(center)
	  	this.setState({center: center}, () => { 
	  		this.setState({sourceAddressPoints: inter, 
	  			sourceLayerHidden: false, 
	  			destLayerHidden: true
	  		}, ()=>{ console.log(inter)})
  		})
  	}
  	else{
  		M.toast({html: 'Please Select CSV first.'})
  	}
  }

  handleDestHeatMap = () => {
  	console.log("heat")
  	if(this.state.destLayerHidden==false){
  		this.setState({destLayerHidden: true})
  	}
  	else if(this.state.jsondata.length>0){
  		console.log(this.state.jsondata)
  		let inter = this.state.jsondata.filter(x => x.to_lat!="NULL"&&x.to_long!="NULL")
  		let center
	  	inter = inter.map(x => [x.to_lat,x.to_long])
	  	inter = _.countBy(inter)
	  	inter = Object.keys(inter).map(x => [parseFloat(x.split(",")[0]), parseFloat(x.split(",")[1]), parseFloat(inter[x])])
	  	center =  inter.reduce((total=[0,0], value) => [total[0]+value[0], total[1]+value[1]])
	  	center = center.map(x => x/inter.length)	
	  	console.log(center)
	  	this.setState({center: center}, () => { 
	  		this.setState({destAddressPoints: inter, 
	  			destLayerHidden: false, 
	  			sourceLayerHidden: true
	  		}, ()=>{ console.log(inter)})
  		})
  	}
  	else{
  		M.toast({html: 'Please Select CSV first.'})
  	}
  }

  render(){
    return (
    	<div>
    		<div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', height: '8vh'}}>
		      <form action="#" style={{width: '50%'}}>
		        <div className="file-field input-field">
		          <div className="btn black">
		            <span>CSV File</span>
		            <input 
		            	type="file" 
		            	onChange={ (e) => this.handleFileChosen(e.target.files[0]) }/>
		          </div>
		          <div className="file-path-wrapper">
		            <input className="file-path validate" type="text"/>
		          </div>
		        </div>
		      </form>
		      <div style={{width: '50%', display: 'flex', justifyContent: 'space-around'}}>
		      	<div className="btn black" onClick={this.handleSourceHeatMap}><a className="white-text">Source Heatmap : Turn {this.state.sourceLayerHidden&&"ON"}{!this.state.sourceLayerHidden&&"OFF"}</a></div>
		      	<div className="btn black" onClick={this.handleDestHeatMap}><a className="white-text">Destination Heatmap : Turn {this.state.destLayerHidden&&"ON"}{!this.state.destLayerHidden&&"OFF"}</a></div>
		      </div>
		      	
		    </div>
	      <div style={{display: 'flex', flexDirection: 'row', height: '92vh'}}>
	      	<Map style = {{width: '50%', height: '92vh'}} center={this.state.center} zoom={12}>
	      		{!this.state.sourceLayerHidden &&
	      			<HeatmapLayer
		            fitBoundsOnLoad
	              fitBoundsOnUpdate
	              points={this.state.sourceAddressPoints}
	              longitudeExtractor={m => m[1]}
	              latitudeExtractor={m => m[0]}
	              intensityExtractor={m => m[2]}
	              gradient={gradient} />
	          }
	          {!this.state.destLayerHidden &&
	      			<HeatmapLayer
		            fitBoundsOnLoad
	              fitBoundsOnUpdate
	              points={this.state.destAddressPoints}
	              longitudeExtractor={m => m[1]}
	              latitudeExtractor={m => m[0]}
	              intensityExtractor={m => m[2]}
	              gradient={gradient} />
	          }
      	    <TileLayer 
      	    	url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      	    	attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      	    />
      	    {this.state.showFromMarker &&
      	    	<Marker position={this.state.from}>
	      	      <Popup>FROM</Popup>
	      	    </Marker>
	      	  }
      	    {this.state.showToMarker &&
      	    	<Marker position={this.state.to} icon={greenIcon}>
	      	      <Popup>TO</Popup>
	      	    </Marker>
	      	  }
      	  </Map>
      	   
		      <ReactTable 
		      	style = {{width: '50%', height: '92vh'}}
		      	getTrProps={(state, rowInfo) => {
		      		if(rowInfo && 
		      		rowInfo.row && 
		      		rowInfo.original.from_lat!=="NULL" &&
			     		rowInfo.original.from_long!=="NULL" &&
			   			rowInfo.original.to_lat!=="NULL" &&
			   			rowInfo.original.to_long!=="NULL"){
		  	   			return {
			      			onClick: (e) => {
			      				console.log('row : ', rowInfo);			      				
					     			this.setState({ 
					   					selected: rowInfo.index,
					   					from: [parseFloat(rowInfo.original.from_lat), parseFloat(rowInfo.original.from_long)],
					   					to: [parseFloat(rowInfo.original.to_lat), parseFloat(rowInfo.original.to_long)],
					   					center: [(parseFloat(rowInfo.original.from_lat)+parseFloat(rowInfo.original.to_lat))/2, (parseFloat(rowInfo.original.from_long)+parseFloat(rowInfo.original.to_long))/2],
					   					showFromMarker: true,
					   					showToMarker: true
				     				});
			      			},
			      			style: {
			      				background: rowInfo.index === this.state.selected ? 'black' : 'white',
			      				color : rowInfo.index === this.state.selected ? 'white' : 'black'
			      			}
			      		}
		      		}
		      		else{
		      			return {
		      				onClick: (e) => {
			      				console.log('row : ', rowInfo);			      				
					     			this.setState({ 
					   					selected: rowInfo.index,
					   					showFromMarker: false,
					   					showToMarker: false
				     				});
				     				M.toast({html: 'Source/ Destination contains null value.'})
			      			}
		      			}
		      		}
		      	}}
		      	data={this.state.jsondata} 
		      	columns={this.state.columns}
		      	filterable
		      	defaultFilterMethod={(filter, row) =>
		      	  String(row[filter.id]) === filter.value}/>
		      </div>
      </div>
    )
  }
}

export default Task;
