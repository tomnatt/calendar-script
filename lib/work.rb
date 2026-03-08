require 'date'
require_relative 'calendar'

class Work < Calendar
  def hours_worked(monday_input)
    monday = Date.parse(monday_input)
    sunday = monday + 7

    calendar_id = ENV.fetch('GOOGLE_CALENDAR_ID')
    title = 'Work'

    events = list_events(calendar_id, title, monday, sunday)
    create_worked_output(events)
  end

  def create_worked_output(events)
    output = {}
    output[:work] = []
    total = 0

    events.items.each do |event|
      length = ((event.end.date_time - event.start.date_time) * 24).to_f
      total += length
      output[:work] << create_work(event, length)
    end

    output[:total] = total
    output
  end

  def create_work(event, length)
    { name:       event.summary,
      start_time: event.start.date_time,
      end_time:   event.end.date_time,
      duration:   length }
  end
end
