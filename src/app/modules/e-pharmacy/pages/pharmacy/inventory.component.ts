import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryEntry, Medicine, UpdateInventoryRequest } from '../../../../../types/pharmacy';
import { PharmacyApiService } from '../../services/pharmacyApi.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  inventory: InventoryEntry[] = [];
  isLoading = true;
  isSaving = false;
  error: string | null = null;
  successMessage: string | null = null;
  searchTerm = '';
  selectedLocation = '';
  userRole: string | null = null;
  newMedicine: Omit<Medicine, 'id'> = this.createEmptyMedicine();

  editModel: Record<string, UpdateInventoryRequest> = {};

  constructor(
    private pharmacyApi: PharmacyApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.userRole = user?.role || null;
    });
    this.loadInventory();
  }

  loadInventory(): void {
    this.isLoading = true;
    this.error = null;

    this.pharmacyApi.getInventory().subscribe({
      next: (entries) => {
        this.inventory = entries || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load inventory.';
        this.isLoading = false;
        console.error('Inventory load error:', err);
      }
    });
  }

  initEdit(entry: InventoryEntry): void {
    this.editModel[entry.medicineId] = {
      medicineId: entry.medicineId,
      quantity: entry.quantity,
      warehouseLocation: entry.warehouseLocation
    };
  }

  saveEntry(medicineId: string): void {
    const payload = this.editModel[medicineId];
    if (!payload) return;

    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    this.pharmacyApi.updateInventory(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Inventory updated successfully.';
        this.loadInventory();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = 'Failed to update inventory entry.';
        console.error('Inventory update error:', err);
      }
    });
  }

  deleteEntry(medicineId: string): void {
    if (!confirm('Delete this inventory entry?')) {
      return;
    }

    this.pharmacyApi.deleteInventoryEntry(medicineId).subscribe({
      next: () => {
        this.successMessage = 'Inventory entry deleted.';
        this.loadInventory();
      },
      error: (err) => {
        this.error = 'Failed to delete inventory entry.';
        console.error('Inventory delete error:', err);
      }
    });
  }

  get filteredInventory(): InventoryEntry[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.inventory.filter((entry) => {
      const matchesTerm = !term ||
        entry.medicineName.toLowerCase().includes(term) ||
        entry.medicineId.toLowerCase().includes(term);

      const matchesLocation = !this.selectedLocation || entry.warehouseLocation === this.selectedLocation;

      return matchesTerm && matchesLocation;
    });
  }

  get uniqueLocations(): string[] {
    return [...new Set(this.inventory.map((e) => e.warehouseLocation))];
  }

  isPharmacist(): boolean {
    const role = (this.userRole || '').toUpperCase();
    return role === 'PHARMACIST' || role === 'ADMIN';
  }

  addMedicine(): void {
    if (!this.newMedicine.name.trim()) {
      this.error = 'Medicine name is required.';
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    const payload = {
      ...this.newMedicine,
      name: this.newMedicine.name.trim(),
      description: this.newMedicine.description.trim(),
      manufacturer: this.newMedicine.manufacturer.trim()
    };

    this.pharmacyApi.addMedicine(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Medicine added successfully.';
        this.newMedicine = this.createEmptyMedicine();
        this.loadInventory();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = 'Failed to add medicine.';
        console.error('Add medicine error:', err);
      }
    });
  }

  private createEmptyMedicine(): Omit<Medicine, 'id'> {
    return {
      name: '',
      description: '',
      manufacturer: '',
      price: 0,
      strength: '',
      dosageForm: 'Tablet',
      prescriptionRequired: false,
      stock: 0,
      category: 'General'
    };
  }
}
