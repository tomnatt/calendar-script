class Config
  def self.pt
    # :grace
    :kat
  end

  def self.first_session
    {
      grace: 'Grace in the gym - first in set',
      kat:   'Kat in Novi - first in set'
    }
  end

  def self.last_session
    {
      grace: 'Grace in the gym - last in set',
      kat:   'Kat in Novi - last in set'
    }
  end

  def self.other_session
    {
      grace: 'Grace in the gym',
      kat:   'Kat in Novi'
    }
  end
end
