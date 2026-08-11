/**
 * Voucher Management Module
 */

import { MOCK_VOUCHERS } from '#core/mock-data.js';
import { UITable } from '#components/ui-table.js';
import { toast } from '#components/toast.js';

export function initVoucherManagementModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Quản lý Voucher Khuyến mãi (Voucher Management)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Phát hành mã ưu đãi giảm cước gửi xe tháng và chiết khấu thanh toán</p>
        </div>
        <button type="button" id="create-voucher-btn" class="px-4 py-2 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span>Tạo mã giảm giá</span>
        </button>
      </div>

      <!-- Vouchers list wrap -->
      <div id="vouchers-table-wrap" class="min-h-[250px]"></div>
    </div>
  `;

  const tableWrap = container.querySelector('#vouchers-table-wrap');
  const createBtn = container.querySelector('#create-voucher-btn');

  const loadVouchers = () => {
    new UITable({
      container: tableWrap,
      pageSize: 5,
      columns: [
        { key: 'code', title: 'Mã Voucher', sortable: true, render: (val) => `<span class="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold font-mono rounded-lg border border-blue-200/50">${val}</span>` },
        { key: 'discount_type', title: 'Loại giảm giá', sortable: true, render: (val, row) => {
            if (val === 'PERCENTAGE') return `Giảm ${row.discount_value}%`;
            return `Giảm ${row.discount_value.toLocaleString()} đ`;
          }
        },
        { key: 'min_order_amount', title: 'Đơn tối thiểu', sortable: true, render: (val) => `${val.toLocaleString()} đ` },
        { key: 'valid_to', title: 'Hết hạn ngày', sortable: true, classNames: 'text-slate-500 font-medium' },
        { key: 'usage_limit', title: 'Giới hạn dùng', render: (val, row) => `${row.used_count || 0} / ${val} lượt` },
        { key: 'is_active', title: 'Trạng thái', render: (val) => val ? 
            '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">Hiệu lực</span>' :
            '<span class="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full">Ngưng</span>'
        },
        { key: 'actions', title: 'Thao tác', render: () => `
          <button data-action="toggle" class="px-2 py-0.5 text-xs text-rose-600 hover:text-rose-900 font-bold transition">Tạm ngưng</button>
        `}
      ],
      data: MOCK_VOUCHERS,
      onRowAction: (action, row) => {
        toast.show(`Thao tác ${action} trên mã ${row.code}`, 'info');
      }
    });
  };

  createBtn.onclick = () => {
    toast.show('Mở giao diện cấu hình phát hành Voucher mới', 'info');
  };

  loadVouchers();
}
