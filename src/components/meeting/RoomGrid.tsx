import type { MeetingRoom } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { Users, MapPin, Check, Building2 } from 'lucide-react';

interface RoomGridProps {
  rooms: MeetingRoom[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
}

export default function RoomGrid({ rooms, selectedRoomId, onSelectRoom }: RoomGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rooms.map(room => {
        const isSelected = selectedRoomId === room.id;
        const isDisabled = room.status === 'maintenance';

        return (
          <div
            key={room.id}
            onClick={() => !isDisabled && onSelectRoom(room.id)}
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : isSelected
                ? 'ring-2 ring-accent-400 shadow-card-hover -translate-y-1'
                : 'hover:-translate-y-1 hover:shadow-card-hover'
            }`}
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-3 right-3">
                <StatusBadge status={room.status} type="room" />
              </div>
              {isSelected && (
                <div className="absolute top-3 left-3 w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold text-sm mb-0.5">{room.name}</h3>
                <div className="flex items-center gap-1.5 text-white/80 text-xs">
                  <Building2 className="w-3 h-3" />
                  {room.floor}F · {room.location}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                  <Users className="w-4 h-4 text-primary-400" />
                  <span className="font-semibold">{room.capacity}</span>
                  <span className="text-neutral-400">人</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {room.facilities.slice(0, 3).map(f => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-medium"
                  >
                    {f}
                  </span>
                ))}
                {room.facilities.length > 3 && (
                  <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-500 text-[10px] font-medium">
                    +{room.facilities.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
