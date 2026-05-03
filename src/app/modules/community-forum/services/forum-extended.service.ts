import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { Post, Reply } from '../../../shared/models/forum.model';
import { environment } from '../../../../environments/environment';
import { PostExtended, ReplyExtended, ForumFilter } from '../models/forum-extended.model';

@Injectable({
  providedIn: 'root'
})
export class ForumExtendedService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private postUrl = `${this.baseUrl}/api/forum/posts`;
  private replyUrl = `${this.baseUrl}/api/forum/replies`;
  
  private postsSubject = new BehaviorSubject<PostExtended[]>([]);
  posts$ = this.postsSubject.asObservable();
  
  private currentPostSubject = new BehaviorSubject<PostExtended | null>(null);
  currentPost$ = this.currentPostSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🚀 ForumExtendedService initialized');
    console.log('📍 Base URL:', this.baseUrl);
    console.log('📍 Post URL:', this.postUrl);
    console.log('📍 Reply URL:', this.replyUrl);
  }

  /**
   * Get authorization headers with token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    console.log('Getting auth headers. Token exists:', !!token);
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Authorization header added with token');
    } else {
      console.warn('No token found in localStorage!');
    }

    return headers;
  }

  // Posts - with filtering and search
  getAllPosts(filter?: ForumFilter): Observable<PostExtended[]> {
    let params = new HttpParams();
    if (filter) {
      if (filter.category) params = params.set('category', filter.category);
      // Only send premiumOnly when explicitly true — avoid sending false which may cause backend 500
      if (filter.premiumOnly === true) params = params.set('premiumOnly', 'true');
      if (filter.searchTerm) params = params.set('search', filter.searchTerm);
      if (filter.sortBy && filter.sortBy !== 'newest') params = params.set('sortBy', filter.sortBy);
    }

    return this.http.get<PostExtended[]>(this.postUrl, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      tap(posts => {
        console.log('✅ Posts loaded successfully:', posts.length, 'posts');
        this.postsSubject.next(posts);
      }),
      catchError(error => {
        console.error('❌ Error loading posts:', error.status, error.statusText);
        // If filtered request fails, retry without any params (bare GET)
        if (params.keys().length > 0) {
          console.warn('Retrying without filter params...');
          return this.http.get<PostExtended[]>(this.postUrl, {
            headers: this.getAuthHeaders()
          }).pipe(
            tap(posts => {
              console.log('✅ Posts loaded (no filter):', posts.length);
              this.postsSubject.next(posts);
            }),
            catchError(err2 => {
              console.error('❌ Retry also failed:', err2.status);
              this.postsSubject.next([]);
              throw err2;
            })
          );
        }
        this.postsSubject.next([]);
        throw error;
      })
    );
  }

  getPostById(id: number): Observable<PostExtended> {
    const url = `${this.postUrl}/${id}`;
    return this.http.get<PostExtended>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((post: any) => {
        // Normalize field aliases from backend
        post.viewCount   = post.viewCount   ?? post.viewsCount   ?? 0;
        post.likerCount  = post.likerCount  ?? post.likesCount   ?? post.likes ?? 0;
        post.replyCount  = post.replyCount  ?? post.repliesCount ?? 0;
        return post as PostExtended;
      }),
      tap(post => {
        console.log('✅ Post loaded:', post.title, '| views:', post.viewCount, '| likes:', post.likerCount);
        this.currentPostSubject.next(post);
      }),
      catchError(error => {
        console.error('❌ POST Error -', error.status, error.statusText);
        throw error;
      })
    );
  }

  createPost(post: Partial<PostExtended>, authorId: number): Observable<PostExtended> {
    const params = { authorId: authorId.toString() };
    return this.http.post<PostExtended>(this.postUrl, post, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(error => {
        // 400 from backend = bad words detected — propagate the backend message
        const msg = error?.error?.message || error?.error?.error || error?.message || 'Erreur lors de la création';
        console.error('❌ createPost error:', error.status, msg);
        throw new Error(msg);
      })
    );
  }

  updatePost(id: number, post: Partial<PostExtended>, authorId?: number): Observable<PostExtended> {
    console.log('🔄 Updating post ID:', id);
    console.log('📝 Post data:', post);
    console.log('👤 Author ID (currentUserId):', authorId);
    
    let params = new HttpParams();
    if (authorId) {
      params = params.set('currentUserId', authorId.toString());
      console.log('📦 Adding currentUserId to query params:', authorId);
    } else {
      console.warn('⚠️ No authorId provided for update');
    }
    
    console.log('🌐 Endpoint URL:', `${this.postUrl}/${id}`);
    console.log('🔐 Auth headers:', this.getAuthHeaders().keys());
    
    return this.http.put<PostExtended>(
      `${this.postUrl}/${id}`, 
      post, 
      { 
        headers: this.getAuthHeaders(),
        params: params
      }
    ).pipe(
      tap(updatedPost => {
        console.log('✅ Post updated successfully:', updatedPost.title);
      }),
      catchError(error => {
        console.error('❌ Error updating post:');
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        console.error('   Message:', error.message);
        console.error('   Full error response:', JSON.stringify(error.error, null, 2));
        throw error;
      })
    );
  }

  deletePost(id: number): Observable<void> {
    const userId = localStorage.getItem('userId');
    console.log('🗑️ Deleting post ID:', id);
    console.log('👤 Current user ID:', userId);
    console.log('🌐 Endpoint URL:', `${this.postUrl}/${id}`);
    console.log('🔐 Auth headers:', this.getAuthHeaders().keys());
    
    let params = new HttpParams();
    if (userId) {
      params = params.set('currentUserId', userId);
      console.log('📦 Adding currentUserId to query params:', userId);
    } else {
      console.warn('⚠️ No userId found in localStorage');
    }
    
    return this.http.delete<void>(`${this.postUrl}/${id}`, { 
      headers: this.getAuthHeaders(),
      params: params
    }).pipe(
      tap(() => {
        console.log('✅ Post deleted successfully');
      }),
      catchError(error => {
        console.error('❌ Error deleting post:');
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        console.error('   Message:', error.message);
        console.error('   Full error response:', JSON.stringify(error.error, null, 2));
        console.error('   Full error object:', error);
        throw error;
      })
    );
  }

  // Replies
  getPostReplies(postId: number): Observable<ReplyExtended[]> {
    console.log('Loading replies for post:', postId);
    return this.http.get<ReplyExtended[]>(`${this.postUrl}/${postId}/replies`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(replies => {
        console.log('✅ Replies loaded:', replies.length);
      }),
      catchError(error => {
        console.warn('⚠️ Error loading replies, using empty array:', error);
        // Return empty array instead of failing
        return of([]);
      })
    );
  }

  getReplyById(id: number): Observable<ReplyExtended> {
    return this.http.get<ReplyExtended>(`${this.replyUrl}/${id}`);
  }

  createReply(postId: number, reply: Partial<ReplyExtended>): Observable<ReplyExtended> {
    const userId = localStorage.getItem('userId');
    const payload = { ...reply, authorId: userId ? +userId : null };

    return this.http.post<ReplyExtended>(`${this.postUrl}/${postId}/replies`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        // 400 from backend = bad words detected — propagate the backend message
        const msg = error?.error?.message || error?.error?.error || error?.message || 'Erreur lors de la publication';
        console.error('❌ createReply error:', error.status, msg);
        throw new Error(msg);
      })
    );
  }

  updateReply(id: number, reply: Partial<ReplyExtended>): Observable<ReplyExtended> {
    console.log('Updating reply ID:', id);
    return this.http.put<ReplyExtended>(`${this.replyUrl}/${id}`, reply, { headers: this.getAuthHeaders() });
  }

  deleteReply(id: number): Observable<void> {
    const userId = localStorage.getItem('userId');
    console.log('🗑️ Deleting reply ID:', id);
    console.log('👤 Current user ID:', userId);
    console.log('🌐 Endpoint URL:', `${this.replyUrl}/${id}`);
    
    let params = new HttpParams();
    if (userId) {
      params = params.set('currentUserId', userId);
      console.log('📦 Adding currentUserId to query params:', userId);
    }
    
    return this.http.delete<void>(`${this.replyUrl}/${id}`, { 
      headers: this.getAuthHeaders(),
      params: params
    }).pipe(
      tap(() => {
        console.log('✅ Reply deleted successfully');
      }),
      catchError(error => {
        console.error('❌ Error deleting reply:');
        console.error('   Status:', error.status);
        console.error('   Full error response:', JSON.stringify(error.error, null, 2));
        throw error;
      })
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  getRecommendations(limit = 5): Observable<PostExtended[]> {
    const userId = localStorage.getItem('userId');
    let params = new HttpParams().set('limit', limit.toString());
    if (userId) params = params.set('userId', userId);

    return this.http.get<PostExtended[]>(`${this.postUrl}/recommendations`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map((posts: any[]) => posts
        .map(p => {
          // Normalize field aliases
          p.viewCount  = p.viewCount  ?? p.viewsCount  ?? 0;
          p.likerCount = p.likerCount ?? p.likesCount  ?? 0;
          p.replyCount = p.replyCount ?? p.repliesCount ?? 0;
          // Compute local score if backend doesn't provide one
          if (p.score == null && p.recommendationScore == null && p.relevanceScore == null) {
            p.score = (p.likerCount * 3) + (p.replyCount * 2) + Math.floor(p.viewCount / 10);
          } else {
            p.score = p.score ?? p.recommendationScore ?? p.relevanceScore;
          }
          return p as PostExtended;
        })
        // Sort by score descending — highest score first
        .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      ),
      tap(posts => console.log('✅ Recommendations loaded & sorted:', posts.map((p: any) => `${p.title} (${p.score})`))),
      catchError(error => {
        console.warn('[Recommendations] Failed:', error?.status, '— hiding section');
        return of([]);
      })
    );
  }
  likePost(postId: number): Observable<PostExtended> {
    return this.http.post<PostExtended>(`${this.postUrl}/${postId}/like`, {}, { headers: this.getAuthHeaders() });
  }

  unlikePost(postId: number): Observable<PostExtended> {
    // Backend only has /like endpoint — calling it again toggles (unlike)
    return this.http.post<PostExtended>(`${this.postUrl}/${postId}/like`, {}, { headers: this.getAuthHeaders() });
  }

  likeReply(replyId: number): Observable<ReplyExtended> {
    return this.http.post<ReplyExtended>(`${this.replyUrl}/${replyId}/like`, {}, { headers: this.getAuthHeaders() });
  }

  unlikeReply(replyId: number): Observable<ReplyExtended> {
    // Same endpoint as like — backend toggles
    return this.http.post<ReplyExtended>(`${this.replyUrl}/${replyId}/like`, {}, { headers: this.getAuthHeaders() });
  }
}
