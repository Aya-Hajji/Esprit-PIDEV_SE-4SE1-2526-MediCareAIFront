import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PREGNANCY_ROUTES } from './pregnancy.routes';

@NgModule({
  imports: [CommonModule, RouterModule.forChild(PREGNANCY_ROUTES)]
})
export class PregnancyModule {}
