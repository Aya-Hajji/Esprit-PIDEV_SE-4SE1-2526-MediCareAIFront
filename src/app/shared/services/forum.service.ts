import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Post, Reply } from '../models/forum.model';
import { environment } from '../../../environments/environment';
import { ApiCatalogService } from './api-catalog.service';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private postUrl = `${environment.apiBaseUrl}/forum/posts`;
  private replyUrl = `${environment.apiBaseUrl}/forum/replies`;

  constructor(
    private http: HttpClient,
    private apiCatalog: ApiCatalogService
  ) {}

  // Posts
  getAllPosts(): Observable<Post[]> {
    return this.apiCatalog.hasPath('/forum/posts').pipe(
      switchMap((exists) => (exists ? this.http.get<Post[]>(this.postUrl) : of([])))
    );
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.postUrl}/${id}`);
  }

  createPost(post: Post): Observable<Post> {
    return this.http.post<Post>(this.postUrl, post);
  }

  updatePost(id: number, post: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.postUrl}/${id}`, post);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.postUrl}/${id}`);
  }

  // Replies
  getPostReplies(postId: number): Observable<Reply[]> {
    return this.http.get<Reply[]>(`${this.postUrl}/${postId}/replies`);
  }

  getReplyById(id: number): Observable<Reply> {
    return this.http.get<Reply>(`${this.replyUrl}/${id}`);
  }

  createReply(postId: number, reply: Reply): Observable<Reply> {
    return this.http.post<Reply>(`${this.postUrl}/${postId}/replies`, reply);
  }

  updateReply(id: number, reply: Partial<Reply>): Observable<Reply> {
    return this.http.put<Reply>(`${this.replyUrl}/${id}`, reply);
  }

  deleteReply(id: number): Observable<void> {
    return this.http.delete<void>(`${this.replyUrl}/${id}`);
  }
}

