import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import * as L from 'leaflet';
import { map, tileLayer, icon, LatLngExpression, Marker } from 'leaflet';

@Component({
  standalone: true,
  imports:[NoteDetailModalComponent,IonicModule],
  selector: 'app-note-detail-modal',
  templateUrl: './note-detail-modal.component.html',
  styleUrls: ['./note-detail-modal.component.scss'],
})
export class NoteDetailModalComponent implements AfterViewInit, OnDestroy {
  @Input() note: any;
  private map: any;
  private marker: Marker | undefined;
  private speechSynthesis: SpeechSynthesis | undefined;

  constructor(private modalController: ModalController) {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  ngAfterViewInit() {
    this.initializeMap();
    this.speakNoteDescription();
  }

  private initializeMap() {
    if (this.note) {
      // Inicializar el mapa
      const mapElement = document.getElementById('noteDetailMap');

      if (mapElement) {
        setTimeout(() => {
          this.map.invalidateSize(true);
        }, 100);

        this.map = L.map('noteDetailMap').setView([0, 0], 13);

        tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.map);

        // Verificar si hay posición
        if (this.note.position) {
          const positionMatch = this.note.position.match(/\(([^,]+),([^)]+)\)/);

          if (positionMatch) {
            const lat = parseFloat(positionMatch[1]);
            const lng = parseFloat(positionMatch[2]);

            const position: L.LatLngExpression = [lat, lng];

            this.map.setView(position, 13);

            // Crear un ícono personalizado para el marcador
            const customIcon = L.icon({
              iconUrl: 'http://leafletjs.com/examples/custom-icons/leaf-green.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
            });

            this.marker = L.marker(position, { icon: customIcon }).addTo(this.map);
          } else {
            console.error('Invalid position data for the note:', this.note);
          }
        }
      } else {
        console.error('Map element not found');
      }
    } else {
      console.error('No data found for the note');
    }
  }

  private speakNoteDescription() {
    if (this.speechSynthesis && this.note && this.note.description) {
      const utterance = new SpeechSynthesisUtterance(this.note.description);
      this.speechSynthesis.speak(utterance);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    // Detener la síntesis de voz al cerrar el modal
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  closeModal() {
    this.modalController.dismiss();
  }
}