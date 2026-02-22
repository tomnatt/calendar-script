require './lib/work'
require './lib/gym_slots'
require './lib/display'

task :default do
  Rake::Task['list_gym'].invoke
end

desc 'List gym slots in calendar'
task :list_gym, [:start_date, :blocks] do |_t, args|
  start_date = args[:start_date] || Date.today
  blocks = args[:blocks] || 6

  cal = GymSlots.new
  slots = cal.get_slots(start_date, blocks)

  puts slots.inspect
  # Display.show_gym_slots(slots)
end

desc 'Update gym slots in calendar'
task :update_gym, [:start_date, :blocks] do |_t, args|
  start_date = args[:start_date] or abort 'Provide start date YYYY-MM-DD'
  blocks = arg[:blocks] or 6

  # Do things
end

desc 'List work entries and total hours worked for a given week'
task :work, [:monday] do |_t, args|
  monday = args[:monday] or abort 'Provide Monday date YYYY-MM-DD'

  cal = Work.new
  worked = cal.hours_worked(monday)
  Display.show_hours_worked(monday, worked)
end
