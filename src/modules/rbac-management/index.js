/**
 * User & RBAC Management Module
 */

import { MOCK_USERS } from '#core/mock-data.js';
import { UITable } from '#components/ui-table.js';
import { toast } from '#components/toast.js';

export function initRbacManagementModule(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-card space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base sm:text-xl font-black text-[#0B2C4D] tracking-tight leading-snug">Quản lý Tài khoản & Phân quyền (RBAC)</h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Quản trị nhân viên, phân quyền vai trò (Roles) và ma trận quyền hạn (Permissions)</p>
        </div>
        <button type="button" id="add-user-btn" class="px-4 py-2 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span>Tạo nhân viên mới</span>
        </button>
      </div>

      <!-- Tab bar -->
      <div class="flex border-b border-slate-200 text-xs font-bold text-slate-500 overflow-x-auto gap-4">
        <button id="tab-users-list" class="px-4 py-2 border-b-2 border-[#0B2C4D] text-[#0B2C4D] whitespace-nowrap transition">Danh sách nhân viên</button>
        <button id="tab-matrix" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-900 whitespace-nowrap transition">Ma trận Phân quyền</button>
      </div>

      <!-- Content panel -->
      <div id="rbac-content-panel" class="min-h-[250px]"></div>
    </div>
  `;

  const contentPanel = container.querySelector('#rbac-content-panel');
  const addUserBtn = container.querySelector('#add-user-btn');
  const tabUsers = container.querySelector('#tab-users-list');
  const tabMatrix = container.querySelector('#tab-matrix');

  const switchTab = (activeTab) => {
    if (activeTab === 'users') {
      tabUsers.classList.add('border-[#0B2C4D]', 'text-[#0B2C4D]');
      tabUsers.classList.remove('border-transparent');
      tabMatrix.classList.remove('border-[#0B2C4D]', 'text-[#0B2C4D]');
      tabMatrix.classList.add('border-transparent');
      renderUsersList();
    } else {
      tabMatrix.classList.add('border-[#0B2C4D]', 'text-[#0B2C4D]');
      tabMatrix.classList.remove('border-transparent');
      tabUsers.classList.remove('border-[#0B2C4D]', 'text-[#0B2C4D]');
      tabUsers.classList.add('border-transparent');
      renderPermissionMatrix();
    }
  };

  const renderUsersList = () => {
    new UITable({
      container: contentPanel,
      pageSize: 5,
      columns: [
        { key: 'fullName', title: 'Họ và tên', sortable: true, classNames: 'font-bold text-slate-900' },
        { key: 'email', title: 'Email đăng nhập', sortable: true, classNames: 'text-slate-500 font-medium' },
        { key: 'isSuperAdmin', title: 'Quyền hệ thống', render: (val) => val ? 
            '<span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full">Super Admin</span>' :
            '<span class="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full">Tenant Operator</span>'
        },
        { key: 'actions', title: 'Hành động', render: () => `
          <button data-action="edit" class="px-2 py-0.5 text-xs text-blue-600 hover:text-blue-900 font-bold transition mr-2">Sửa</button>
          <button data-action="block" class="px-2 py-0.5 text-xs text-rose-600 hover:text-rose-900 font-bold transition">Khóa</button>
        `}
      ],
      data: MOCK_USERS,
      onRowAction: (action, row) => {
        toast.show(`Thực hiện hành động ${action} trên tài khoản ${row.fullName}`, 'info');
      }
    });
  };

  const renderPermissionMatrix = () => {
    contentPanel.innerHTML = `
      <div class="overflow-x-auto border border-slate-100 rounded-xl">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
              <th class="p-3">Module / Chức năng</th>
              <th class="p-3 text-center">Super Admin</th>
              <th class="p-3 text-center">Tenant Admin</th>
              <th class="p-3 text-center">Parking Manager</th>
              <th class="p-3 text-center">Gate Operator</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-600">
            <tr>
              <td class="p-3 font-semibold text-slate-900">Quản lý Cư dân & Căn hộ</td>
              <td class="p-3 text-center"><input type="checkbox" checked disabled /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-900">Kiểm soát xe vào / ra làn (LPR)</td>
              <td class="p-3 text-center"><input type="checkbox" checked disabled /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-900">Cấu hình Cổng / Barie / Camera</td>
              <td class="p-3 text-center"><input type="checkbox" checked disabled /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-900">Gia hạn vé tháng / Quản lý cước</td>
              <td class="p-3 text-center"><input type="checkbox" checked disabled /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" checked /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-900">Kiểm toán Audit Log hệ thống</td>
              <td class="p-3 text-center"><input type="checkbox" checked disabled /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
              <td class="p-3 text-center"><input type="checkbox" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-end pt-3">
        <button id="save-matrix-btn" class="px-4 py-2 bg-[#0B2C4D] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition">
          Lưu cấu hình phân quyền
        </button>
      </div>
    `;

    contentPanel.querySelector('#save-matrix-btn').onclick = () => {
      toast.show('Đã cập nhật cấu hình ma trận phân quyền RBAC thành công', 'success');
    };
  };

  tabUsers.onclick = () => switchTab('users');
  tabMatrix.onclick = () => switchTab('matrix');

  // Initial tab loading
  switchTab('users');

  addUserBtn.onclick = () => {
    toast.show('Mở biểu mẫu tạo mới nhân viên vận hành', 'info');
  };
}
