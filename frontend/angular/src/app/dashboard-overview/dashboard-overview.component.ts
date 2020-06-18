import { ElementRef, ViewEncapsulation,  ViewChild, AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { WebSocketService } from '../web-socket.service';
import { Chart } from 'chart.js';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ConstantsService } from '../constants.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';



@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [WebSocketService]
})

export class DashboardOverviewComponent implements OnInit {
  scenes = [];
  sessionData:any;
  session_form;
  heartRateChart;

  defaultSelected;

  hidden = [
    // 'Hond',
    // 'Vogel',
    // 'Zwarte bloem',
    // 'Boom',
    // 'Groene boom',
    // 'Plant',
    // 'Schaap'
  ];

  shown = [
    // 'Fortnite',
    // 'Apple',
    // 'koe',
    // 'nog iets',
    // 'android',
    // 'laptop'
  ];
  
  @ViewChild('sliders') sliders: ElementRef;

  constructor(private formBuilder: FormBuilder, private http: HttpClient, private route: ActivatedRoute, private _constant: ConstantsService, private socket: WebSocketService) {
    this.socket.emit("reload", {});
    this.sessionData = {name: '', id:'', scene_id: ''};

    this.http.get(`${_constant.apiLocation}/scenes`).subscribe(data => {
        this.scenes = Object.values(data);
    });  


    this.session_form = this.formBuilder.group({
      scene: ''
    });

  }

  onSubmit(data) {
    console.log(data);
  }

      // this.webSocketService.emit('change scene', data);

  subscription: Subscription;
  statusText: string;

  data = [];
  labels = [];

  async ngOnInit() {
    let sessionid = this.route.snapshot.paramMap.get('sessionid');
    this.sessionData = await this.http.get(`http://localhost:3000/sessions/${sessionid}`).toPromise();
    
    if(Object.keys(this.sessionData).length < 1) {
      location.href = '/';
    }

    this.defaultSelected = this.sessionData['scene_id'];

    const propsData = await this.http.get(`http://localhost:3000/scene/${this.sessionData.scene_id}/props`).toPromise();
    this.shown = Object.values(propsData).map(data => data);
    // `${data.name} [${data.prop_type}] / ${data.id}`
    this.shown.forEach(obj => {
        this.propSlider(obj);
    });

    // setInterval( () => this.showHeartbeat, 5000);

    this.subscription = timer(0, 60000).pipe(
      switchMap(() => this.showHeartbeat())
    ).subscribe(result => console.log("yeet"));

    this.heartRateChart = new Chart('heartRate', {
      type: 'line',

      data: {

        labels: this.labels,
        datasets: [{
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          label: "Heart rate",
          data: this.data,
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          yAxes: [{
            ticks: {
              stepSize: 5,
              beginAtZero: false,
              max: Math.max(...this.data) + (25 - (Math.max(...this.data) % 25))
            }
          }]
        }
      }
    });
  }

  async showHeartbeat() {
    let form = new FormData();
    let jsonData = await this.http.post('http://localhost:3000/heartbeat/create', form).toPromise();
    let jsonObjects = Object.values(jsonData).slice(-60);
    this.data = jsonObjects.map( (value) => {
      return value.value;
    });
    this.labels = jsonObjects.map( (value) => {
      return value.time;
    });
    this.heartRateChart.data.datasets[0].data = this.data;
    this.heartRateChart.data.label = this.labels;
    this.heartRateChart.update();
  }



  drop(event: CdkDragDrop<string[]>) {
    // console.log(event.item.element.nativeElement)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }

    let id = event.item.element.nativeElement.getAttribute('propid');

    if (event.container.id == 'cdk-drop-list-1' && event.previousContainer.id == 'cdk-drop-list-0') {
      this.shown.forEach(obj => {
        if(obj.id == id) {
          this.propSlider(obj);
        }
      });
      this.socket.emit('show prop', { id });
    } else if (event.container.id == 'cdk-drop-list-0' && event.previousContainer.id == 'cdk-drop-list-1') {
      (<HTMLInputElement>document.querySelector(`[sliderpropid='${id}']`)).remove();
      this.socket.emit('hide prop', { id });
    }

  }




  propSlider(prop){
    
      var div = document.createElement("div");
      var input = document.createElement("input");
      var title = document.createElement("p");
    

      div.setAttribute('sliderpropid', prop.id);
      input.setAttribute('name', prop.name);
      title.innerHTML = prop.name;
      div.setAttribute('class', 'volume-prop');
      input.setAttribute('type', 'range');
      input.setAttribute('propId', prop.id);

      input.addEventListener('change', e => {
        console.log(input.value, input.getAttribute('propId'));
      });

      div.appendChild(title);
      div.appendChild(input);
      this.sliders.nativeElement.appendChild(div);
  }




}
