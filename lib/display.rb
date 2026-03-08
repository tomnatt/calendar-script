class Display
  def self.show_hours_worked(day, worked)
    puts "Week starting: #{day}"
    puts "Hours worked:  #{worked[:total]}"
    puts ''

    worked[:work].each do |w|
      # Date   start-end   duration
      puts "#{w[:start_time].strftime('%a')}\t" \
           "#{w[:start_time].strftime('%H:%M')}-" \
           "#{w[:end_time].strftime('%H:%M')}\t" \
           "#{w[:duration]}"
    end
  end

  def self.show_gym_slots(start, slots)
    puts "Gym slots starting: #{start}"
    puts "#{slots[:total_bookings]} bookings ahead"
    puts "Next session: #{slots[:next_booking].strftime('%d/%m/%y %H:%M (%a)')}"
    puts ''

    slots[:bookings].each do |slot|
      out = name_time(slot)
      out += '  ← next session' if slots[:next_booking] == slot[:start_time]
      puts out
    end
  end

  def self.name_time(slot)
    # Name    date (day)
    slot[:name].ljust(34) + slot[:start_time].strftime('%d/%m/%y %H:%M (%a)')
  end
end
