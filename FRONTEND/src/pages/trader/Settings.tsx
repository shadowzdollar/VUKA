import { Card, Input, Button, Select } from "../../components";

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security.</p>
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Profile Information</h2>
        <div className="space-y-4">
          <Input label="Full Name" defaultValue="John Doe" />
          <Input label="Phone Number" defaultValue="+250 700 000 000" />
          <Input label="Email Address" defaultValue="john.doe@example.com" />
          <Input label="Business Registration Number" defaultValue="RB-2026-12345" />
          <Button variant="primary">Update Profile</Button>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Security</h2>
        <div className="space-y-4">
          <Input label="Current Password" type="password" />
          <Input label="New Password" type="password" />
          <Input label="Confirm New Password" type="password" />
          <Button variant="primary">Update Password</Button>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Preferences</h2>
        <div className="space-y-4">
          <Select label="Language" defaultValue="en">
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
            <option value="fr">Français</option>
            <option value="rw">Kinyarwanda</option>
          </Select>
          <Select label="Currency" defaultValue="RWF">
            <option value="RWF">Rwandan Franc (RWF)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
            <option value="UGX">Ugandan Shilling (UGX)</option>
            <option value="TZS">Tanzanian Shilling (TZS)</option>
          </Select>
          <Select label="Timezone" defaultValue="Africa/Kigali">
            <option value="Africa/Kigali">Africa/Kigali</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Kampala">Africa/Kampala</option>
            <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
          </Select>
          <Button variant="primary">Save Preferences</Button>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-black">Email Notifications</div>
              <div className="text-sm text-gray-500">Receive transaction updates via email</div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-black">SMS Notifications</div>
              <div className="text-sm text-gray-500">Receive important alerts via SMS</div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-black">Push Notifications</div>
              <div className="text-sm text-gray-500">Receive in-app notifications</div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </div>
      </Card>

      <Card padding="lg" variant="bordered">
        <h2 className="text-xl font-bold text-black mb-4 text-red-600">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-black">Delete Account</div>
              <div className="text-sm text-gray-500">Permanently delete your account and all data</div>
            </div>
            <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
