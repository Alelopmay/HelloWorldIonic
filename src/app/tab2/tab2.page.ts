import { Component, ViewChild, inject } from '@angular/core';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { Note } from '../model/note';
import { CommonModule } from '@angular/common';

import { AlertController } from '@ionic/angular';
import { BehaviorSubject, Observable, from, map, mergeMap, tap, toArray } from 'rxjs';
import { NoteService } from '../services/note.service';
import { UIService } from '../services/ui.service';
import { Camera, CameraResultType } from '@capacitor/camera';
import { NoteDetailModalComponent } from '../note-detail-modal/note-detail-modal.component';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Tab2Page {
  public _notes$: BehaviorSubject<Note[]> = new BehaviorSubject<Note[]>([]);
  private lastNote: Note | undefined = undefined;
  private UIS = inject(UIService);
  private notesPerPage: number = 15;
  public isInfiniteScrollAvailable: boolean = true;
  public _editNote!: Note;
  public _deleteNote!: Note;

  public noteS = new NoteService();
  public form: any;

  constructor(
    public platform: Platform,
    public modalController: ModalController,
    private alertController: AlertController,
    private navCtrl: NavController
  ) {
    console.log("CONS");
  }

  ionViewDidEnter() {
    this.platform.ready().then(() => {
      console.log(this.platform.height());
      this.notesPerPage = Math.round(this.platform.height() / 50);
      this.loadNotes(true);
    });
  }

  editNote(note: any) {
    this.presentEditAlert(note);
  }

  async presentEditAlert(note: any) {
    const alert = await this.alertController.create({
      header: 'Edit Note',
      inputs: [
        {
          name: 'newTitle',
          type: 'text',
          value: note.title,
          placeholder: 'New Title',
        },
        {
          name: 'newDescription',
          type: 'textarea',
          value: note.description,
          placeholder: 'New Content',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: async () => {
            await this.UIS.showToast('Edited Note cancelled', 'danger');
            console.log('Operación de edición cancelada');
          },
        },
        {
          text: 'Save',
          handler: (data) => {
            const updatedNote: any = { ...note, title: data.newTitle, description: data.newDescription };

            this.noteS.updateNote(updatedNote).then(async () => {
              await this.UIS.showToast('Edited Note succesfully', 'success');
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteNoteSliding(note: Note) {
    this.deleteNote(note);
  }

  loadNotes(fromFirst: boolean, event?: any) {
    if (fromFirst == false && this.lastNote == undefined) {
      this.isInfiniteScrollAvailable = false;
      event.target.complete();
      return;
    }
    this.convertPromiseToObservableFromFirebase(this.noteS.readNext(this.lastNote, this.notesPerPage)).subscribe(d => {
      event?.target.complete();
      if (fromFirst) {
        this._notes$.next(d);
      } else {
        this._notes$.next([...this._notes$.getValue(), ...d]);
      }
    })
  }

  private convertPromiseToObservableFromFirebase(promise: Promise<any>): Observable<Note[]> {
    return from(promise).pipe(
      tap(d => {
        if (d.docs && d.docs.length >= this.notesPerPage) {
          this.lastNote = d.docs[d.docs.length - 1];
        } else {
          this.lastNote = undefined;
        }
      }),
      mergeMap(d => d.docs),
      map(d => {
        return { key: (d as any).id, ...(d as any).data() };
      }),
      toArray()
    );
  }

  async deleteNote($event: Note) {
    const confirmAlert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta nota?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this._deleteNote = $event;
            if (this.noteS && typeof this.noteS.deleteNote === 'function') {
              this.noteS.deleteNote($event).then(() => {
                console.log('Nota eliminada exitosamente');
              }).catch((error: any) => {
                console.error('Error al eliminar la nota:', error);
              });
            } else {
              console.error('noteS.deleteNote no es una función');
            }
          },
        },
      ],
    });

    await confirmAlert.present();
  }

  doRefresh(event: any) {
    this.isInfiniteScrollAvailable = true;
    this.loadNotes(true, event);
  }

  loadMore(event: any) {
    this.loadNotes(false, event);
  }

  async takePic() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
    });
    const img = new Image();
    img.src = 'data:image/png;base64,' + image.base64String;
    // Reemplaza la siguiente línea según tu implementación del formulario
    this.form.get('photo')?.setValue(img.src);
  }


  async openNoteDetailModal(event: any, note: any) {
    // Verifica si el clic proviene de la parte blanca del ion-item
    if (this.isClickOnWhiteArea(event)) {
      const modal = await this.modalController.create({
        component: NoteDetailModalComponent,
        componentProps: {
          note: note,
        },
      });

      await modal.present();
    }
  }

  isClickOnWhiteArea(event: any): boolean {
    // Obtiene las coordenadas del clic
    const clickX = event.clientX;
    const clickY = event.clientY;

    // Obtiene las coordenadas del ion-item
    const itemRect = event.currentTarget.getBoundingClientRect();
    const itemX = itemRect.left;
    const itemY = itemRect.top;

    // Calcula la posición relativa del clic dentro del ion-item
    const relativeX = clickX - itemX;
    const relativeY = clickY - itemY;

    // Define un área sensible, por ejemplo, la mitad izquierda del ion-item
    const sensitiveAreaWidth = itemRect.width / 2;

    // Verifica si el clic está en el área sensible y no sobre un botón de opción
    const isClickOnWhiteArea = relativeX < sensitiveAreaWidth && !this.isClickOnOptionButton(event.target);

    return isClickOnWhiteArea;
  }

  isClickOnOptionButton(target: any): boolean {
    // Verifica si el clic fue en un botón de opción
    return target && target.tagName === 'ION-ITEM-OPTION';
  }

 
}
