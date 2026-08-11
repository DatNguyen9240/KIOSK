/**
 * Notification & Dispatcher Management Module
 */

import { UITable } from '#components/ui-table.js';
import { toast } from '#components/toast.js';

export function initNotificationManagementModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Hệ thống Thông báo & Email Reminder (Notification logs)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Giám sát trạng thái gửi thông báo và chỉnh sửa mẫu tin nhắn</p>
        </div>
        <button type="button" id="config-template-btn" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center gap-2">
          <svg class="w-4 h-4 text-[#0B2C4D] fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          <span>Sửa mẫu tin</span>
        </button>
      </div>

      <!-- Logs table container -->
      <div id="notif-logs-table-wrap" class="min-h-[250px]"></div>
    </div>
  `;

  const logsWrap = container.querySelector('#notif-logs-table-wrap');
  const templateBtn = container.querySelector('#config-template-btn');

  const loadNotifLogs = () => {
    // Mock notification logs matching DB columns
    const mockLogs = [
      { id: '1', channel: 'EMAIL', recipient: 'tuan.tv@gmail.com', event_type: 'VEHICLE_BLOCKED', title: 'Thông báo khóa phương tiện', status: 'SENT', sent_at: '2026-08-11 08:30:12' },
      { id: '2', channel: 'SMS', recipient: '0912345678', event_type: 'CARD_EXPIRED', title: null, status: 'FAILED', sent_at: null, error_message: 'Gateway Timeout' },
      { id: '3', channel: 'PUSH', recipient: 'Resident-A1-1205', event_type: 'PAYMENT_SUCCESS', title: 'Gia hạn thành công', status: 'SENT', sent_at: '2026-08-11 09:15:00' },
      { id: '4', channel: 'EMAIL', recipient: 'hang.nt@gmail.com', event_type: 'CARD_EXPIRED', title: 'Cảnh báo vé xe sắp hết hạn', status: 'PENDING', sent_at: null }
    ];

    new UITable({
      container: logsWrap,
      pageSize: 5,
      columns: [
        { key: 'channel', title: 'Kênh gửi', sortable: true, render: (val) => {
            let color = 'bg-blue-50 text-blue-700';
            if (val === 'SMS') color = 'bg-teal-50 text-teal-700';
            if (val === 'PUSH') color = 'bg-purple-50 text-purple-700';
            return `<span class="px-2 py-0.5 rounded-md font-bold text-[10px] ${color}">${val}</span>`;
          }
        },
        { key: 'event_type', title: 'Loại sự kiện', sortable: true, render: (val) => `<span class="font-mono text-slate-500 text-[11px]">${val}</span>` },
        { key: 'recipient', title: 'Người nhận', sortable: true, classNames: 'font-semibold text-slate-800' },
        { key: 'title', title: 'Tiêu đề', render: (val) => val || '<span class="text-slate-400 font-normal italic">Không có tiêu đề (SMS)</span>' },
        { key: 'status', title: 'Trạng thái', sortable: true, render: (val, row) => {
            if (val === 'SENT') return `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">Đã gửi</span>`;
            if (val === 'FAILED') return `<span class="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full hover:underline cursor-pointer" title="${row.error_message}">Lỗi gửi tin</span>`;
            return `<span class="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full">Đang chờ</span>`;
          }
        },
        { key: 'sent_at', title: 'Thời gian', sortable: true, render: (val) => val || '—' }
      ],
      data: mockLogs
    });
  };

  templateBtn.onclick = () => {
    toast.show('Mở cấu hình chỉnh sửa Mẫu Email / SMS Templates', 'info');
  };

  loadNotifLogs();
}
