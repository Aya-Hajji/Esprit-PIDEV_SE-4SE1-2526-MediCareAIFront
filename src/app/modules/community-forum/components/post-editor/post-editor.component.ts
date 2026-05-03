import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EMPTY, Subject, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ForumExtendedService } from '../../services/forum-extended.service';
import { BadWordsService } from '../../services/bad-words.service';
import { PostExtended } from '../../models/forum-extended.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-post-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.css']
})
export class PostEditorComponent implements OnInit, OnDestroy {

  postForm!: FormGroup;
  isEditMode = false;
  postId: number | null = null;
  loading = false;
  submitting = false;
  checkingBadWords = false;
  badWordsError = '';
  existingPost: PostExtended | null = null;
  charCount = 0;
  selectedTags: string[] = [];
  private destroy$ = new Subject<void>();

  categories = [
    { name: 'Santé Générale', value: 'general' },
    { name: 'Nutrition', value: 'nutrition' },
    { name: 'Exercice', value: 'exercise' },
    { name: 'Mental', value: 'mental' },
    { name: 'Questions Médicales', value: 'medical' },
    { name: 'Autre', value: 'other' }
  ];

  suggestedTags = [
    'Depression', 'Anxiété', 'Sommeil', 'Perte de poids', 'Fitness',
    'Nutrition', 'Médecin', 'Traitement', 'Symptômes', 'Allergie',
    'Diabète', 'Tension', 'Santé mentale', 'Exercice'
  ];

  constructor(
    private fb: FormBuilder,
    private forumService: ForumExtendedService,
    private badWordsService: BadWordsService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]],
      category: ['general', Validators.required],
      premiumOnly: [false],
      tags: ['']
    });

    this.postForm.get('content')?.valueChanges.subscribe(value => {
      this.charCount = value ? value.length : 0;
    });
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.postId = +params['id'];
        this.loadPost();
      }
    });
  }

  loadPost(): void {
    if (!this.postId) return;

    this.loading = true;
    console.log('🔄 loadPost() called for post ID:', this.postId);
    
    this.forumService.getPostById(this.postId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (post) => {
          console.log('✅ Post loaded:', post.title);
          this.existingPost = post;
          this.populateForm(post);
          this.loading = false;
          console.log('⏱️ Setting loading=false');
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement du post:', error);
          this.loading = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
  }

  populateForm(post: PostExtended): void {
    this.postForm.patchValue({
      title: post.title,
      content: post.content,
      category: post.category || 'general',
      premiumOnly: post.premiumOnly || false,
      tags: post.tags?.join(', ') || ''
    });
    this.selectedTags = post.tags || [];
    this.charCount = post.content?.length || 0;
  }

  addTag(tag: string): void {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
  }

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.removeTag(tag);
    } else {
      this.addTag(tag);
    }
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.postForm.value;
    const textToCheck = `${formValue.title} ${formValue.content}`;

    this.authService
      .getCurrentUserId()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((userId) => {
          if (!userId) {
            alert('Impossible de récupérer vos informations utilisateur.\nVeuillez vous reconnecter.');
            this.router.navigate(['/login']);
            return EMPTY;
          }

          this.checkingBadWords = true;
          this.badWordsError = '';
          this.submitting = false;
          this.cdr.detectChanges();

          return this.badWordsService.checkText(textToCheck).pipe(
            catchError(() => of({ isClean: true, message: '' })),
            map((result) => ({ userId, result }))
          );
        })
      )
      .subscribe({
        next: ({ userId, result }) => {
          this.checkingBadWords = false;

          if (!result.isClean) {
            this.badWordsError =
              result.message || 'Votre texte contient des mots inappropriés. Veuillez les supprimer.';
            this.cdr.detectChanges();
            return;
          }

          this.submitPost(formValue, userId);
        },
        error: () => {
          this.checkingBadWords = false;
          this.cdr.detectChanges();
        }
      });
  }

  private submitPost(formValue: any, userId: number): void {
    this.submitting = true;
    this.badWordsError = '';
    this.cdr.detectChanges();

    const postData: Partial<PostExtended> = {
      title: formValue.title,
      content: formValue.content,
      category: formValue.category,
      premiumOnly: formValue.premiumOnly || false,
      tags: this.selectedTags
    };

    if (this.isEditMode && this.postId) {
      this.forumService.updatePost(this.postId, postData, userId).subscribe({
        next: (updatedPost) => {
          this.submitting = false;
          alert('✅ Discussion mise à jour avec succès !');
          this.router.navigate(['/community/forums/post', updatedPost.id]);
        },
        error: (error) => {
          this.submitting = false;
          const msg = error?.message || error?.error?.message || 'Erreur lors de la mise à jour';
          this.badWordsError = msg;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.forumService.createPost(postData, userId).subscribe({
        next: () => {
          this.submitting = false;
          alert('✅ Discussion créée avec succès !');
          this.router.navigate(['/community/forums/dashboard']);
        },
        error: (error) => {
          this.submitting = false;
          // Show backend message (bad words or other error)
          const msg = error?.message || error?.error?.message || 'Erreur lors de la création';
          this.badWordsError = msg;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/community/forums/dashboard']);
  }

  getProgressColor(): string {
    const percentage = (this.charCount / 5000) * 100;
    if (percentage < 50) return '#4CAF50';
    if (percentage < 80) return '#FFC107';
    return '#FF9800';
  }

  getProgressPercentage(): number {
    return (this.charCount / 5000) * 100;
  }
}