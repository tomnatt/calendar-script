require 'google/apis/calendar_v3'
require 'googleauth'

class Calendar
  def initialize
    json_key_file = ENV.fetch('GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_FILE')
    abort 'Missing key file' if json_key_file.nil?

    @service = Google::Apis::CalendarV3::CalendarService.new
    creds = Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: File.open(json_key_file),
      scope:       Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY
    )

    creds.fetch_access_token!
    @service.authorization = creds
  end
end
