require 'date'
require_relative 'calendar'

class GymSlots < Calendar
  def get_slots(start_date, blocks)
    # 8 slots per block
    number_slots = blocks * 8

    slots = get_slot_list(start_date)
    create_slots_output(slots, number_slots)
  end

  def create_slots_output(slots, number_slots)
    output = {}
    output[:total_bookings] = number_slots
    output[:bookings] = []

    # Iterate through the given number of bookings
    slots.items.first(number_slots).each do |slot|
      output[:bookings] << create_booking(slot)

      # If booking today or first booking after today add to output
      output[:next_booking] ||= slot.start.date_time if slot.start.date_time >= DateTime.now
    end

    output
  end

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
  def update_slots(start_date, blocks)
    # 8 slots per block
    number_slots = blocks * 8
    slots = get_slot_list(start_date)

    output = {
      total_bookings: number_slots,
      bookings:       []
    }

    first_block = nil

    # Iterate through the given number of bookings
    slots.items.first(number_slots).each_with_index do |slot, i|
      # If booking today or first booking after today add to output
      output[:next_booking] ||= slot.start.date_time if slot.start.date_time >= DateTime.now

      # Identify the first of a set in this block of dates
      first_block ||= i if slot.summary.casecmp?('Grace in the gym - first in set')

      # Set up old and new versions of a booking
      booking_pair = {
        old: create_booking(slot)
      }
      update_slot(i, first_block, slot)
      booking_pair[:new] = create_booking(slot)

      output[:bookings] << booking_pair
    end

    output
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength

  def create_booking(slot)
    { name:       slot.summary,
      start_time: slot.start.date_time,
      end_time:   slot.end.date_time }
  end

  def get_slot_list(start_date)
    start = Date.parse(start_date)
    final = start + 365

    calendar_id = ENV.fetch('GOOGLE_CALENDAR_ID')
    title = 'Grace in the gym'

    list_events(calendar_id, title, start, final)
  end

  def update_slot(index, first_block, slot)
    return if first_block.nil?

    old_summary = slot.summary
    slot.summary = if ((index - first_block) % 8).zero?
                     'Grace in the gym - first in set'
                   elsif (index - first_block) % 8 == 7
                     'Grace in the gym - last in set'
                   else
                     'Grace in the gym'
                   end

    # Then write back if in write mode and it has changed
    write_slot(slot) if @write && slot.summary != old_summary
  end

  def write_slot(slot)
    calendar_id = ENV.fetch('GOOGLE_CALENDAR_ID')
    @service.update_event(calendar_id, slot.id, slot)
  end
end
