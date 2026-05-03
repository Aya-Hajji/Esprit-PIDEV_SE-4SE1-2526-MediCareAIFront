import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, Reply } from '../models/forum.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private postUrl = `${environment.apiUrl}/forum/posts`;
  private replyUrl = `${environment.apiUrl}/forum/replies`;

  constructor(private http: HttpClient) {}

  // Posts
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.postUrl);
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
