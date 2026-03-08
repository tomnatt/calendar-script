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

  def self.show_updated_gym_slots(start, slots)
    puts "Gym slots starting: #{start}"
    puts "#{slots[:total_bookings]} bookings ahead"
    puts "Next session: #{slots[:next_booking].strftime('%d/%m/%y %H:%M (%a)')}"
    puts ''

    slots[:bookings].each do |slot_pair|
      out = name_time(slot_pair[:old])
      out += new_name_time(slot_pair[:new])
      out += '  ← next session' if slots[:next_booking] == slot_pair[:new][:start_time]
      puts out
    end
  end

  def self.name_time(slot)
    # Date (day)    Name
    slot[:start_time].strftime('%d/%m/%y %H:%M (%a)').ljust(28) + slot[:name].ljust(34)
  end

  def self.new_name_time(slot)
    # →   Name
    '→'.ljust(5) + slot[:name].ljust(34)
  end
end
