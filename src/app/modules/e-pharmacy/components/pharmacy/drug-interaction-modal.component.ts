import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrugInteractionAlert } from '../../../../../types/pharmacy';

@Component({
  selector: 'app-drug-interaction-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drug-interaction-modal.component.html',
  styleUrls: ['./drug-interaction-modal.component.css']
})
export class DrugInteractionModalComponent {
  @Input() isOpen = false;
  @Input() interactions: DrugInteractionAlert[] = [];
  @Input() hasCriticalInteractions = false;
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getSeverityIconColor(severity: string): string {
    switch (severity) {
      case 'HIGH':
        return '#DC2626';
      case 'MODERATE':
        return '#F59E0B';
      case 'LOW':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  }

  confirm(): void {
    this.onConfirm.emit();
  }

  cancel(): void {
    this.onCancel.emit();
  }
}
