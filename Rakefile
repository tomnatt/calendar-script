require './lib/work'
require './lib/gym_slots'
require './lib/display'

task :default do
  Rake::Task['list_gym'].invoke
end

desc 'List gym slots in calendar'
task :list_gym, [:start_date, :blocks] do |_t, args|
  start_date = args[:start_date] || Date.today.to_s
  blocks = args[:blocks] || 8

  cal = GymSlots.new
  slots = cal.get_slots(start_date, blocks)
  Display.show_gym_slots(start_date, slots)
end

desc 'Update gym slots in calendar'
task :update_gym, [:start_date, :write] do |_t, args|
  start_date = args[:start_date] || Date.today.to_s
  write = args[:write] == 'w'

  # Hard code "8 blocks from date"
  blocks = 8

  # Do things
  cal = GymSlots.new(write: write)
  slots = cal.update_slots(start_date, blocks)
  Display.show_updated_gym_slots(start_date, slots)
end

desc 'List work entries and total hours worked for a given week'
task :work, [:monday] do |_t, args|
  monday = args[:monday] or abort 'Provide Monday date YYYY-MM-DD'

  cal = Work.new
  worked = cal.hours_worked(monday)
  Display.show_hours_worked(monday, worked)
end
