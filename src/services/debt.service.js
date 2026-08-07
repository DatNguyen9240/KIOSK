/**
 * Debt & Payment Report Service
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';

const MOCK_DEBT_REPORTS = [
  { id: 'R01', residentName: 'Trần Văn Tuấn', plateNumber: '30F-123.45', apartmentNumber: 'A1-1205', packageType: 'Xe máy • 6 tháng', dueDate: '16/05/2026', status: 'PENDING', amount: 600000, statusLabel: 'Chờ thanh toán', tower: 'A1' },
  { id: 'R02', residentName: 'Nguyễn Thị Hằng', plateNumber: '30A-789.10', apartmentNumber: 'A2-0806', packageType: 'Ô tô • 12 tháng', dueDate: '30/05/2026', status: 'EXPIRING_SOON', amount: 14400000, statusLabel: 'Sắp hết hạn', tower: 'A2' },
  { id: 'R03', residentName: 'Lê Văn Nam', plateNumber: '51H-222.22', apartmentNumber: 'A1-0912', packageType: 'Ô tô • 3 tháng', dueDate: '28/05/2026', status: 'PENDING', amount: 3600000, statusLabel: 'Chờ thanh toán', tower: 'A1' },
  { id: 'R04', residentName: 'Phạm Quang Huy', plateNumber: '93C-567.89', apartmentNumber: 'A3-1010', packageType: 'Xe máy • 1 năm', dueDate: '02/06/2026', status: 'PAID', amount: 1200000, statusLabel: 'Đã thanh toán', tower: 'A3' },
  { id: 'R05', residentName: 'Vũ Thu Hà', plateNumber: '29H-456.87', apartmentNumber: 'A2-1101', packageType: 'Ô tô • 6 tháng', dueDate: '10/05/2026', status: 'EXPIRING_SOON', amount: 7200000, statusLabel: 'Sắp hết hạn', tower: 'A2' }
];

export async function fetchDebtReport(filters = {}) {
  const { tower = 'ALL', search = '', status = 'ALL', page = 1, pageSize = CONFIG.DEFAULT_PAGE_SIZE } = filters;

  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 200));

    let filtered = MOCK_DEBT_REPORTS;

    if (tower !== 'ALL') {
      filtered = filtered.filter(item => item.tower === tower);
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.residentName.toLowerCase().includes(term) ||
        item.plateNumber.toLowerCase().includes(term) ||
        item.apartmentNumber.toLowerCase().includes(term)
      );
    }

    if (status !== 'ALL') {
      filtered = filtered.filter(item => item.status === status);
    }

    const total = filtered.length;
    const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);

    return {
      success: true,
      data: filtered,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      summary: {
        totalItems: total,
        totalAmount
      }
    };
  }

  return apiRequest('/reports/debt', { params: filters });
}
