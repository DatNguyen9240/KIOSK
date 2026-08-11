/**
 * System Audit & Security Logs Module
 */

import { UITable } from '#components/ui-table.js';
import { toast } from '#components/toast.js';

export function initAuditManagementModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Nhật ký Hệ thống & Kiểm toán Bảo mật (Audit Log)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Theo dõi lịch sử tác động thay đổi cấu hình, cước phí và thẻ xe</p>
        </div>
      </div>

      <!-- Logs list container -->
      <div id="audit-logs-table-wrap" class="min-h-[250px]"></div>
    </div>
  `;

  const logsWrap = container.querySelector('#audit-logs-table-wrap');

  const loadAuditLogs = () => {
    // Mock audit logs matching DB columns
    const mockLogs = [
      { id: '1', actor: 'superadmin@PARKING', action: 'UPDATE_TARIFF', entity_type: 'tariff_rules', ip_address: '118.70.12.33', created_at: '2026-08-11 09:30:00', old_data: { monthly_fee: 1000000 }, new_data: { monthly_fee: 1200000 } },
      { id: '2', actor: 'admin@thap1.vn', action: 'BLOCK_CARD', entity_type: 'parking_cards', ip_address: '1.53.190.102', created_at: '2026-08-11 10:15:24', old_data: { status: 'ACTIVE' }, new_data: { status: 'BLOCKED', reason: 'Lost card reported' } },
      { id: '3', actor: 'admin@thap1.vn', action: 'APPROVE_VEHICLE', entity_type: 'vehicle_requests', ip_address: '1.53.190.102', created_at: '2026-08-11 10:45:00', old_data: { status: 'WAITING_APPROVE' }, new_data: { status: 'APPROVED' } }
    ];

    new UITable({
      container: logsWrap,
      pageSize: 5,
      columns: [
        { key: 'actor', title: 'Người thực hiện', sortable: true, classNames: 'font-bold text-slate-900' },
        { key: 'action', title: 'Hành động', sortable: true, render: (val) => {
            let color = 'text-blue-600 bg-blue-50';
            if (val.includes('BLOCK')) color = 'text-rose-600 bg-rose-50';
            if (val.includes('APPROVE')) color = 'text-emerald-600 bg-emerald-50';
            return `<span class="px-2 py-0.5 rounded-md font-bold text-[10px] ${color}">${val}</span>`;
          }
        },
        { key: 'entity_type', title: 'Bảng dữ liệu', sortable: true, render: (val) => `<span class="font-mono text-slate-500 text-[11px]">${val}</span>` },
        { key: 'ip_address', title: 'Địa chỉ IP', sortable: true, classNames: 'text-slate-500 font-semibold font-mono text-[11px]' },
        { key: 'created_at', title: 'Thời gian', sortable: true, classNames: 'text-slate-500 font-medium' },
        { key: 'actions', title: 'Chi tiết', render: () => `
          <button data-action="diff" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#0B2C4D] rounded-xl text-[11px] font-bold transition">
            Xem JSON Diff
          </button>
        `}
      ],
      data: mockLogs,
      onRowAction: (action, row) => {
        if (action === 'diff') {
          const oldStr = JSON.stringify(row.old_data, null, 2);
          const newStr = JSON.stringify(row.new_data, null, 2);
          toast.show(`JSON DIFF:\n[TRƯỚC]: ${oldStr}\n[SAU]: ${newStr}`, 'info');
          alert(`CHI TIẾT KIỂM TOÁN - JSON DIFF\n\n[DỮ LIỆU CŨ]:\n${oldStr}\n\n[DỮ LIỆU MỚI]:\n${newStr}`);
        }
      }
    });
  };

  loadAuditLogs();
}
