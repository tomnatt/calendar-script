require './lib/calendar'
require './lib/gym_slots'

task :default do
  Rake::Task['list_entries'].invoke
end

desc 'List calendar entries that match name pattern'
task :list_entries do
  cal = GymSlots.new
end

desc 'List work entries and total hours worked for a given week'
task :work, [:monday] do |_t, args|
  monday = args[:monday] or abort 'Provide Monday date YYYY-MM-DD'

  cal = Calendar.new
  # worked = cal.hours_worked(monday)
  cal.hours_worked(monday)

  # puts worked.inspect
end
