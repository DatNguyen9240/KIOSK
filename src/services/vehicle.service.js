/**
 * Vehicle Management & Search Service
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';

// Mock Vehicle Database for local testing/demo
const MOCK_VEHICLES = [
  { id: 'V01', plateNumber: '30F-123.45', residentName: 'Trần Văn Tuấn', apartmentNumber: 'A1-1205', vehicleType: 'CAR', vehicleName: 'Honda CR-V', cardNumber: 'CARD-8831', status: 'ACTIVE', expireDate: '2026-08-30' },
  { id: 'V02', plateNumber: '30A-789.10', residentName: 'Nguyễn Thị Hằng', apartmentNumber: 'A2-0806', vehicleType: 'CAR', vehicleName: 'Toyota Camry', cardNumber: 'CARD-8832', status: 'EXPIRING_SOON', expireDate: '2026-08-10' },
  { id: 'V03', plateNumber: '51H-222.22', residentName: 'Lê Văn Nam', apartmentNumber: 'A1-0912', vehicleType: 'MOTORBIKE', vehicleName: 'Honda SH 150i', cardNumber: 'CARD-8833', status: 'EXPIRED', expireDate: '2026-07-28' },
  { id: 'V04', plateNumber: '93C-567.89', residentName: 'Phạm Quang Huy', apartmentNumber: 'A3-1010', vehicleType: 'CAR', vehicleName: 'Ford Ranger', cardNumber: 'CARD-8834', status: 'ACTIVE', expireDate: '2026-09-15' },
  { id: 'V05', plateNumber: '29H-456.87', residentName: 'Vũ Thu Hà', apartmentNumber: 'A2-1101', vehicleType: 'MOTORBIKE', vehicleName: 'Yamaha Grande', cardNumber: 'CARD-8835', status: 'EXPIRING_SOON', expireDate: '2026-08-09' },
  { id: 'V06', plateNumber: '30G-678.90', residentName: 'Trần Văn Tuấn', apartmentNumber: 'A1-1205', vehicleType: 'MOTORBIKE', vehicleName: 'Honda Wave Alpha', cardNumber: 'CARD-8836', status: 'ACTIVE', expireDate: '2026-09-01' }
];

export async function searchVehicle(query = '', searchType = 'ALL') {
  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 200)); // Simulate API delay
    const term = query.toLowerCase().trim();

    if (!term) return MOCK_VEHICLES;

    return MOCK_VEHICLES.filter(v => {
      const matchPlate = v.plateNumber.toLowerCase().includes(term);
      const matchName = v.residentName.toLowerCase().includes(term);
      const matchApt = v.apartmentNumber.toLowerCase().includes(term);
      const matchCard = v.cardNumber.toLowerCase().includes(term);

      if (searchType === 'PLATE') return matchPlate;
      if (searchType === 'NAME') return matchName;
      if (searchType === 'APARTMENT') return matchApt;
      if (searchType === 'CARD') return matchCard;

      return matchPlate || matchName || matchApt || matchCard;
    });
  }

  return apiRequest('/vehicles/search', { params: { q: query, type: searchType } });
}

export async function getVehiclesByApartment(apartmentNumber) {
  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 150));
    return MOCK_VEHICLES.filter(v => v.apartmentNumber.toLowerCase() === apartmentNumber.toLowerCase());
  }

  return apiRequest(`/vehicles/apartment/${encodeURIComponent(apartmentNumber)}`);
}
