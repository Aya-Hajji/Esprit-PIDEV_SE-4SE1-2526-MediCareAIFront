import { CommonModule, SlicePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SpecialtyService } from '../../../../shared/services/specialty.service';
import { SymptomService } from '../../../../shared/services/symptom.service';
import { DiseaseService } from '../../../../shared/services/disease.service';
import { Specialty, SpecialtyDTO } from '../../../../shared/models/specialty.model';
import { Symptom, SymptomDTO } from '../../../../shared/models/symptom.model';
import { Disease, DiseaseDTO } from '../../../../shared/models/disease.model';

type Tab = 'diseases' | 'specialties' | 'symptoms';
type ModalMode = 'add' | 'edit';

@Component({
  selector: 'app-admin-medical-data',
  standalone: true,
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './admin-medical-data.component.html',
  styleUrl: './admin-medical-data.component.css'
})
export class AdminMedicalDataComponent implements OnInit {
  activeTab: Tab = 'diseases';

  specialties: Specialty[] = [];
  symptoms: Symptom[] = [];
  diseases: Disease[] = [];

  isLoading = false;
  errorMsg = '';
  successMsg = '';

  showModal = false;
  modalMode: ModalMode = 'add';
  modalTab: Tab = 'diseases';

  showDeleteConfirm = false;
  deleteTarget: { tab: Tab; id: number; name: string } | null = null;

  searchQuery = '';

  specialtyForm: SpecialtyDTO = { name: '', description: '' };
  symptomForm: SymptomDTO = { name: '', description: '' };
  diseaseForm: DiseaseDTO & { specialtyId?: number; symptomIds?: number[] } = {
    name: '',
    description: '',
    causes: '',
    treatment: '',
    specialtyId: undefined,
    symptomIds: []
  };
  editingId: number | undefined;

  constructor(
    private specialtyService: SpecialtyService,
    private symptomService: SymptomService,
    private diseaseService: DiseaseService
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading = true;
    this.errorMsg = '';

    forkJoin({
      specialties: this.specialtyService.getAllSpecialties(),
      symptoms: this.symptomService.getAllSymptoms(),
      diseases: this.diseaseService.getAllDiseases()
    }).subscribe({
      next: (data) => {
        this.specialties = data.specialties;
        this.symptoms = data.symptoms;
        this.diseases = data.diseases;
        console.log('All data loaded:', {
          specialties: this.specialties.length,
          symptoms: this.symptoms.length,
          diseases: this.diseases.length
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement données médicales:', err);
        this.errorMsg = 'Erreur chargement des données. Veuillez rafraîchir la page.';
        this.isLoading = false;
      }
    });
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
    this.searchQuery = '';
    this.clearMessages();
  }

  clearMessages() {
    this.errorMsg = '';
    this.successMsg = '';
  }

  showSuccess(msg: string) {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3000);
  }

  get filteredSpecialties(): Specialty[] {
    if (!this.searchQuery.trim()) return this.specialties;
    const q = this.searchQuery.toLowerCase();
    return this.specialties.filter(s =>
      s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    );
  }

  get filteredSymptoms(): Symptom[] {
    if (!this.searchQuery.trim()) return this.symptoms;
    const q = this.searchQuery.toLowerCase();
    return this.symptoms.filter(s =>
      s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    );
  }

  get filteredDiseases(): Disease[] {
    if (!this.searchQuery.trim()) return this.diseases;
    const q = this.searchQuery.toLowerCase();
    return this.diseases.filter(d =>
      d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
    );
  }

  openAddModal(tab: Tab) {
    this.modalMode = 'add';
    this.modalTab = tab;
    this.editingId = undefined;
    this.resetForms();
    this.showModal = true;
    this.clearMessages();
  }

  openEditModal(tab: Tab, item: Specialty | Symptom | Disease) {
    this.modalMode = 'edit';
    this.modalTab = tab;
    this.editingId = item.id;
    this.resetForms();

    if (tab === 'specialties') {
      const s = item as Specialty;
      this.specialtyForm = { name: s.name, description: s.description || '' };
    } else if (tab === 'symptoms') {
      const s = item as Symptom;
      this.symptomForm = { name: s.name, description: s.description || '' };
    } else if (tab === 'diseases') {
      const d = item as Disease;
      const matchedSpecialty = this.specialties.find(sp => sp.name === d.specialtyName);
      
      // Charger les symptômes associés
      const selectedSymptomIds: number[] = [];
      if (d.symptoms && d.symptoms.length > 0) {
        d.symptoms.forEach(symptomName => {
          const symptom = this.symptoms.find(s => s.name === symptomName);
          if (symptom && symptom.id) {
            selectedSymptomIds.push(symptom.id);
          }
        });
      }
      
      this.diseaseForm = {
        name: d.name,
        description: d.description || '',
        causes: d.causes || '',
        treatment: d.treatment || '',
        specialtyId: matchedSpecialty?.id,
        symptomIds: selectedSymptomIds
      };
    }

    this.showModal = true;
    this.clearMessages();
  }

  closeModal() {
    this.showModal = false;
    this.resetForms();
  }

  resetForms() {
    this.specialtyForm = { name: '', description: '' };
    this.symptomForm = { name: '', description: '' };
    this.diseaseForm = { name: '', description: '', causes: '', treatment: '', specialtyId: undefined, symptomIds: [] };
  }

  submitForm() {
    if (this.modalTab === 'specialties') this.saveSpecialty();
    else if (this.modalTab === 'symptoms') this.saveSymptom();
    else if (this.modalTab === 'diseases') this.saveDisease();
  }

  saveSpecialty() {
    if (!this.specialtyForm.name?.trim()) { this.errorMsg = 'Le nom est requis.'; return; }
    const obs = this.modalMode === 'add'
      ? this.specialtyService.createSpecialty(this.specialtyForm as Specialty)
      : this.specialtyService.updateSpecialty(this.editingId!, this.specialtyForm as Specialty);

    obs.subscribe({
      next: () => {
        this.showSuccess(this.modalMode === 'add' ? 'Spécialité ajoutée !' : 'Spécialité mise à jour !');
        this.specialtyService.getAllSpecialties().subscribe({
          next: (d: Specialty[]) => this.specialties = d,
          error: (err) => console.error('Erreur lors du rechargement des spécialités:', err)
        });
        this.closeModal();
      },
      error: (err) => { 
        console.error('Erreur lors de la sauvegarde de la spécialité:', err);
        this.errorMsg = 'Erreur lors de la sauvegarde.'; 
      }
    });
  }

  saveSymptom() {
    if (!this.symptomForm.name?.trim()) { this.errorMsg = 'Le nom est requis.'; return; }
    const obs = this.modalMode === 'add'
      ? this.symptomService.createSymptom(this.symptomForm as Symptom)
      : this.symptomService.updateSymptom(this.editingId!, this.symptomForm as Symptom);

    obs.subscribe({
      next: () => {
        this.showSuccess(this.modalMode === 'add' ? 'Symptôme ajouté !' : 'Symptôme mis à jour !');
        this.symptomService.getAllSymptoms().subscribe({
          next: (d: Symptom[]) => this.symptoms = d,
          error: (err) => console.error('Erreur lors du rechargement des symptômes:', err)
        });
        this.closeModal();
      },
      error: (err) => { 
        console.error('Erreur lors de la sauvegarde du symptôme:', err);
        this.errorMsg = 'Erreur lors de la sauvegarde.'; 
      }
    });
  }

  saveDisease() {
    if (!this.diseaseForm.name?.trim()) { this.errorMsg = 'Le nom est requis.'; return; }
    
    // Créer le payload pour l'API (sans specialtyId et symptomIds)
    const diseasePayload: Disease = {
      id: this.diseaseForm.id,
      name: this.diseaseForm.name,
      description: this.diseaseForm.description,
      causes: this.diseaseForm.causes,
      treatment: this.diseaseForm.treatment
    };

    const obs = this.modalMode === 'add'
      ? this.diseaseService.createDisease(diseasePayload)
      : this.diseaseService.updateDisease(this.editingId!, diseasePayload);

    obs.subscribe({
      next: (savedDisease: Disease) => {
        if (!savedDisease.id) {
          console.error('Disease saved but no ID returned');
          this.closeModal();
          this.diseaseService.getAllDiseases().subscribe((d: Disease[]) => this.diseases = d);
          return;
        }

        const operationsToPerform: any[] = [];

        // Ajouter la spécialité si sélectionnée
        if (this.diseaseForm.specialtyId) {
          operationsToPerform.push(
            this.diseaseService.addSpecialtyToDisease(savedDisease.id, this.diseaseForm.specialtyId)
          );
        }

        // Ajouter les symptômes associés
        const symptomIds = this.diseaseForm.symptomIds || [];
        if (symptomIds.length > 0) {
          symptomIds.forEach(sid => {
            operationsToPerform.push(
              this.diseaseService.addSymptomToDisease(savedDisease.id!, sid)
            );
          });
        }

        // Exécuter toutes les opérations en parallèle
        if (operationsToPerform.length > 0) {
          forkJoin(operationsToPerform).subscribe({
            next: () => {
              this.showSuccess(this.modalMode === 'add' ? 'Maladie ajoutée !' : 'Maladie mise à jour !');
              this.diseaseService.getAllDiseases().subscribe((d: Disease[]) => this.diseases = d);
              this.closeModal();
            },
            error: (err) => {
              console.error('Erreur lors de l\'ajout des spécialités/symptômes:', err);
              this.showSuccess(this.modalMode === 'add' ? 'Maladie ajoutée !' : 'Maladie mise à jour !');
              this.diseaseService.getAllDiseases().subscribe((d: Disease[]) => this.diseases = d);
              this.closeModal();
            }
          });
        } else {
          this.showSuccess(this.modalMode === 'add' ? 'Maladie ajoutée !' : 'Maladie mise à jour !');
          this.diseaseService.getAllDiseases().subscribe((d: Disease[]) => this.diseases = d);
          this.closeModal();
        }
      },
      error: (err) => { 
        console.error('Erreur lors de la sauvegarde de la maladie:', err); 
        this.errorMsg = 'Erreur lors de la sauvegarde.'; 
      }
    });
  }

  confirmDelete(tab: Tab, item: Specialty | Symptom | Disease) {
    this.deleteTarget = { tab, id: item.id!, name: item.name };
    this.showDeleteConfirm = true;
    this.clearMessages();
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    const { tab, id } = this.deleteTarget;
    const obs =
      tab === 'specialties' ? this.specialtyService.deleteSpecialty(id) :
      tab === 'symptoms' ? this.symptomService.deleteSymptom(id) :
      this.diseaseService.deleteDisease(id);

    obs.subscribe({
      next: () => {
        this.showSuccess('Suppression réussie !');
        if (tab === 'specialties') {
          this.specialtyService.getAllSpecialties().subscribe({
            next: (d: Specialty[]) => this.specialties = d,
            error: (err) => console.error('Erreur rechargement spécialités:', err)
          });
        }
        if (tab === 'symptoms') {
          this.symptomService.getAllSymptoms().subscribe({
            next: (d: Symptom[]) => this.symptoms = d,
            error: (err) => console.error('Erreur rechargement symptômes:', err)
          });
        }
        if (tab === 'diseases') {
          this.diseaseService.getAllDiseases().subscribe({
            next: (d: Disease[]) => this.diseases = d,
            error: (err) => console.error('Erreur rechargement maladies:', err)
          });
        }
        this.cancelDelete();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.errorMsg = 'Erreur lors de la suppression.';
        this.cancelDelete();
      }
    });
  }

  toggleSymptomId(id: number) {
    const ids = this.diseaseForm.symptomIds || [];
    const idx = ids.indexOf(id);
    if (idx > -1) ids.splice(idx, 1);
    else ids.push(id);
    this.diseaseForm.symptomIds = [...ids];
  }

  isSymptomSelected(id: number): boolean {
    return (this.diseaseForm.symptomIds || []).includes(id);
  }

  getTabLabel(tab: Tab): string {
    return tab === 'diseases' ? 'Maladies' : tab === 'specialties' ? 'Spécialités' : 'Symptômes';
  }
}