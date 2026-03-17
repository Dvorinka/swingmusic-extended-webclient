#!/usr/bin/env python3
"""
Test script for Spotify downloader web UI integration
"""

import subprocess
import time
import sys
import os

def check_file_exists(filepath, description):
    """Check if a file exists and report status"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath}")
        return False

def check_component_structure():
    """Check if Vue.js components are properly structured"""
    print("🔍 Checking Vue.js Component Structure...")
    
    checks = [
        ("src/components/SpotifyDownloader/SpotifyDownloader.vue", "Main Spotify downloader component"),
        ("src/components/SettingsView/SpotifyDownloader.vue", "Settings component"),
        ("src/views/SpotifyDownloader.vue", "View component"),
        ("src/assets/icons/spotify.svg", "Spotify icon"),
        ("src/settings/spotify/index.ts", "Settings integration"),
    ]
    
    passed = 0
    for filepath, description in checks:
        if check_file_exists(filepath, description):
            passed += 1
    
    return passed, len(checks)

def check_navigation_integration():
    """Check if navigation integration is complete"""
    print("\n🧭 Checking Navigation Integration...")
    
    # Check navigation items
    nav_file = "src/components/LeftSidebar/navitems.ts"
    if os.path.exists(nav_file):
        with open(nav_file, 'r') as f:
            content = f.read()
            
        if 'spotifyDownloader' in content:
            print("✅ Spotify downloader added to navigation")
            nav_ok = True
        else:
            print("❌ Spotify downloader not found in navigation")
            nav_ok = False
    else:
        print("❌ Navigation file not found")
        nav_ok = False
    
    # Check router integration
    router_file = "src/router/index.ts"
    if os.path.exists(router_file):
        with open(router_file, 'r') as f:
            content = f.read()
            
        if 'SpotifyDownloader' in content and 'spotify-downloader' in content:
            print("✅ Router integration complete")
            router_ok = True
        else:
            print("❌ Router integration incomplete")
            router_ok = False
    else:
        print("❌ Router file not found")
        router_ok = False
    
    return nav_ok and router_ok

def check_settings_integration():
    """Check settings integration"""
    print("\n⚙️  Checking Settings Integration...")
    
    # Check settings file
    settings_file = "src/settings/index.ts"
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            content = f.read()
            
        if 'spotify' in content:
            print("✅ Settings integration complete")
            return True
        else:
            print("❌ Settings integration incomplete")
            return False
    else:
        print("❌ Settings file not found")
        return False

def check_api_compatibility():
    """Check if frontend API calls are compatible"""
    print("\n🌐 Checking API Compatibility...")
    
    # Check main component for API calls
    component_file = "src/components/SpotifyDownloader/SpotifyDownloader.vue"
    if os.path.exists(component_file):
        with open(component_file, 'r') as f:
            content = f.read()
        
        # Check for required API endpoints
        required_endpoints = [
            '/api/spotify/metadata',
            '/api/spotify/download',
            '/api/spotify/queue',
            '/api/spotify/cancel/',
            '/api/spotify/retry/',
            '/api/settings/spotify'
        ]
        
        missing_endpoints = []
        for endpoint in required_endpoints:
            if endpoint not in content:
                missing_endpoints.append(endpoint)
        
        if not missing_endpoints:
            print("✅ All required API endpoints are used")
            return True
        else:
            print(f"❌ Missing API endpoints: {missing_endpoints}")
            return False
    else:
        print("❌ Main component file not found")
        return False

def check_responsive_design():
    """Check responsive design implementation"""
    print("\n📱 Checking Responsive Design...")
    
    component_file = "src/components/SpotifyDownloader/SpotifyDownloader.vue"
    if os.path.exists(component_file):
        with open(component_file, 'r') as f:
            content = f.read()
        
        # Check for responsive design elements
        responsive_indicators = [
            '@media (max-width: 768px)',
            'flex-wrap',
            'mobile-friendly',
            'responsive'
        ]
        
        found_indicators = [indicator for indicator in responsive_indicators if indicator in content]
        
        if len(found_indicators) >= 2:
            print(f"✅ Responsive design implemented ({len(found_indicators)} indicators)")
            return True
        else:
            print(f"⚠️  Limited responsive design ({len(found_indicators)} indicators)")
            return False
    else:
        print("❌ Component file not found")
        return False

def run_build_test():
    """Test if the project builds successfully"""
    print("\n🔨 Testing Build Process...")
    
    # Change to web client directory
    os.chdir('swingmusic-webclient')
    
    try:
        # Run build command
        result = subprocess.run(
            ['npm', 'run', 'build'],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes
        )
        
        if result.returncode == 0:
            print("✅ Build completed successfully")
            return True
        else:
            print(f"❌ Build failed with error:")
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Build timed out")
        return False
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm")
        return False
    except Exception as e:
        print(f"❌ Build test failed: {e}")
        return False

def main():
    """Run all UI integration tests"""
    print("🎨 Spotify Downloader UI Integration Tests\n")
    
    # Change to project root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run all tests
    tests = [
        ("Component Structure", check_component_structure),
        ("Navigation Integration", check_navigation_integration),
        ("Settings Integration", check_settings_integration),
        ("API Compatibility", check_api_compatibility),
        ("Responsive Design", check_responsive_design),
        ("Build Process", run_build_test),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            if test_name == "Component Structure":
                passed, total = test_func()
                result = passed == total
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*50)
    print("📊 UI TEST RESULTS SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<10} {test_name}")
    
    print("="*50)
    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All UI tests passed! Web client integration is ready.")
        print("\nNext steps:")
        print("1. Start SwingMusic backend server")
        print("2. Run 'npm run dev' in swingmusic-webclient directory")
        print("3. Open http://localhost:5173 in browser")
        print("4. Navigate to Spotify Downloader and test functionality")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the issues above.")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
