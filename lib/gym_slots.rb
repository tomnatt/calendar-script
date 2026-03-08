require 'date'
require_relative 'calendar'

class GymSlots < Calendar
  def get_slots(start_date, blocks)
    # 8 slots per block
    number_slots = blocks * 8
    start = Date.parse(start_date)
    final = start + 365

    calendar_id = ENV.fetch('GOOGLE_CALENDAR_ID')
    title = 'Grace in the gym'

    slots = list_events(calendar_id, title, start, final)
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

  def create_booking(slot)
    { name:       slot.summary,
      start_time: slot.start.date_time,
      end_time:   slot.end.date_time }
  end
end
