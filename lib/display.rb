class Display
  def self.show_hours_worked(day, worked)
    puts "Week starting: #{day}"
    puts "Hours worked:  #{worked[:total]}"
    puts ''

    worked[:work].each do |w|
      # Date   start-end   duration
      puts "#{w[:start_time].strftime('%a')}\t" \
           "#{w[:start_time].strftime('%H')}:#{w[:start_time].strftime('%M')}-" \
           "#{w[:end_time].strftime('%H')}:#{w[:end_time].strftime('%M')}\t" \
           "#{w[:duration]}"
    end
  end
end
