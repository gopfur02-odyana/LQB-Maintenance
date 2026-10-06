export interface FacilityLocation {
  id: string;
  name: string;
  code: string;
  floors: {
    floorNumber: number;
    floorName: string;
    rooms: string[];
  }[];
}

export const FACILITY_LOCATIONS: FacilityLocation[] = [
  {
    id: 'cinta_charlie',
    name: 'CINTA CHARLIE',
    code: 'CC',
    floors: [
      {
        floorNumber: 1,
        floorName: 'Lantai 1',
        rooms: ['Masjid', 'Meeting Room'],
      },
      {
        floorNumber: 2,
        floorName: 'Lantai 2',
        rooms: ['Production Office', 'SPV Room'],
      },
      {
        floorNumber: 3,
        floorName: 'Lantai 3',
        rooms: ['Guest Room 1', 'Guest Room 2'],
      },
    ],
  },
  {
    id: 'cinta_papa',
    name: 'CINTA PAPA',
    code: 'CP',
    floors: [
      {
        floorNumber: 1,
        floorName: 'Lantai 1',
        rooms: ['Dining Room', 'Kitchen', 'Smoke Room', 'Recreation Room', 'Laundry'],
      },
      {
        floorNumber: 2,
        floorName: 'Lantai 2',
        rooms: [
          'Room 01 (Kamar 01)',
          'Room 02 (Kamar 02)',
          'Room 03 (Kamar 03)',
          'Room 04 (Kamar 04)',
          'Room 05 (Kamar 05)',
          'Room 06 (Kamar 06)',
          'Room 07 (Kamar 07)',
          'Room 08 (Kamar 08)',
          'Room 09 (Kamar 09)',
          'Room 10 (Kamar 10)',
        ],
      },
      {
        floorNumber: 3,
        floorName: 'Lantai 3',
        rooms: ['Food Storage', 'Chemical Storage'],
      },
      {
        floorNumber: 4,
        floorName: 'Lantai 4',
        rooms: ['Room 11 (Kamar 11)', 'Room 12 (Kamar 12)'],
      },
    ],
  },
];

// Helper to get formatted location string
export function formatLocationString(platformName: string, floorName: string, roomName: string): string {
  if (!platformName) return 'Area Fasilitas PHE OSES';
  const parts = [platformName];
  if (floorName) parts.push(floorName);
  if (roomName) parts.push(roomName);
  return parts.join(', ');
}
