import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="messages-container">
      <div class="messages-sidebar">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button class="btn-compose">✎ Compose</button>
        </div>
        <div class="conversation-list">
          <div class="conversation" *ngFor="let conv of conversations" 
               [class.active]="activeConversation === conv.id"
               (click)="activeConversation = conv.id">
            <div class="conversation-avatar">{{ conv.initials }}</div>
            <div class="conversation-info">
              <h4>{{ conv.name }}</h4>
              <p>{{ conv.lastMessage }}</p>
            </div>
            <span class="unread-badge" *ngIf="conv.unread">{{ conv.unread }}</span>
          </div>
        </div>
      </div>

      <div class="messages-main">
        <div class="message-thread" *ngIf="activeConversation">
          <div class="thread-header">
            <h3>{{ getCurrentConversation().name }}</h3>
            <span class="specialty">{{ getCurrentConversation().specialty }}</span>
          </div>
          
          <div class="messages-list">
            <div class="message" *ngFor="let msg of getCurrentConversation().messages"
                 [class.sent]="msg.sent">
              <div class="message-content">
                <p>{{ msg.text }}</p>
                <span class="message-time">{{ msg.time | date:'short' }}</span>
              </div>
            </div>
          </div>

          <div class="message-input">
            <input type="text" placeholder="Type your message..." class="input-field">
            <button class="btn-send">Send</button>
          </div>
        </div>

        <div class="empty-state" *ngIf="!activeConversation">
          <p>Select a conversation or start a new one</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      height: calc(100vh - 100px);
      gap: 0;
      background: #f9fafb;
    }
    .messages-sidebar {
      background: white;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sidebar-header h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }
    .btn-compose {
      background: none;
      border: none;
      color: #00a082;
      cursor: pointer;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
    }
    .btn-compose:hover {
      background: #f3f4f6;
    }
    .conversation-list {
      flex: 1;
      overflow-y: auto;
    }
    .conversation {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: 12px;
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: all 0.3s ease;
      align-items: center;
    }
    .conversation:hover {
      background: #f9fafb;
    }
    .conversation.active {
      background: #e6f9f5;
      border-left: 3px solid #00a082;
    }
    .conversation-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #00a082;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    .conversation-info h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #111827;
    }
    .conversation-info p {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .unread-badge {
      background: #ff4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .messages-main {
      background: white;
      display: flex;
      flex-direction: column;
    }
    .message-thread {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .thread-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }
    .thread-header h3 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #111827;
    }
    .specialty {
      font-size: 12px;
      color: #6b7280;
    }
    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      display: flex;
      margin-bottom: 8px;
    }
    .message.sent {
      justify-content: flex-end;
    }
    .message-content {
      max-width: 60%;
      background: #f3f4f6;
      padding: 12px 16px;
      border-radius: 12px;
    }
    .message.sent .message-content {
      background: #00a082;
      color: white;
    }
    .message-content p {
      margin: 0 0 4px 0;
      font-size: 14px;
    }
    .message-time {
      font-size: 11px;
      color: #6b7280;
    }
    .message.sent .message-time {
      color: rgba(255, 255, 255, 0.7);
    }
    .message-input {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    .input-field {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      font-size: 14px;
    }
    .input-field:focus {
      outline: none;
      border-color: #00a082;
      box-shadow: 0 0 0 3px rgba(0, 160, 130, 0.1);
    }
    .btn-send {
      background: #00a082;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-send:hover {
      background: #008866;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
    }
  `]
})
export class MessagesComponent {
  activeConversation: number | null = null;

  conversations = [
    {
      id: 1,
      name: 'Dr. Ahmed Hassan',
      specialty: 'Cardiologist',
      initials: 'AH',
      lastMessage: 'How are your blood pressure readings?',
      unread: 2,
      messages: [
        {
          text: 'Good morning! How are you feeling?',
          time: new Date(Date.now() - 3600000),
          sent: false
        },
        {
          text: 'I\'m doing well, thanks for asking',
          time: new Date(Date.now() - 3000000),
          sent: true
        },
        {
          text: 'How are your blood pressure readings?',
          time: new Date(Date.now() - 1800000),
          sent: false
        }
      ]
    },
    {
      id: 2,
      name: 'Dr. Fatima Mohamed',
      specialty: 'Dermatologist',
      initials: 'FM',
      lastMessage: 'Please upload a photo of the affected area',
      unread: 1,
      messages: [
        {
          text: 'I noticed some rash on my arm',
          time: new Date(Date.now() - 7200000),
          sent: true
        },
        {
          text: 'Please upload a photo of the affected area',
          time: new Date(Date.now() - 6800000),
          sent: false
        }
      ]
    },
    {
      id: 3,
      name: 'Dr. Sarah Johnson',
      specialty: 'General Practitioner',
      initials: 'SJ',
      lastMessage: 'See you at the appointment next week',
      unread: 0,
      messages: [
        {
          text: 'Thanks for the follow-up',
          time: new Date(Date.now() - 86400000),
          sent: true
        },
        {
          text: 'See you at the appointment next week',
          time: new Date(Date.now() - 82800000),
          sent: false
        }
      ]
    }
  ];

  getCurrentConversation() {
    return this.conversations.find(c => c.id === this.activeConversation) || this.conversations[0];
  }
}
