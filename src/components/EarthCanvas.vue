<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import Globe from 'globe.gl';
import { api, type CityData } from '../api';

const globeDiv = ref<HTMLElement | null>(null);
const cities = ref<CityData[]>([]);
const userCity = ref<CityData | null>(null);
let world: any = null;
let intervalId: number | null = null;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const pickNearestCity = (lat: number, lng: number, list: CityData[]): CityData | null => {
  const first = list[0];
  if (!first) return null;
  let best: CityData = first;
  let bestD = haversineKm(lat, lng, best.lat, best.lng);
  for (let i = 1; i < list.length; i++) {
    const c = list[i];
    if (!c) continue;
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
};

// 加载全球状态数据
const loadStatus = async () => {
  const data = await api.getStatus();
  cities.value = data.cities;

  // 使用真实地理位置（浏览器 Geolocation），选择最近的城市节点
  userCity.value = cities.value[0] || null;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = pickNearestCity(pos.coords.latitude, pos.coords.longitude, cities.value);
        userCity.value = nearest;
        if (world) updateGlobePoints();
      },
      () => {
        // 用户拒绝定位时，保持默认第一个城市
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60_000 }
    );
  }

  if (world) {
    updateGlobePoints();
  }
};

// 更新地球上的光点
const updateGlobePoints = () => {
  if (!world) return;

  const pointsData = cities.value.map(city => ({
    lat: city.lat,
    lng: city.lng,
    size: 0.5 + (city.brightness / 100) * 1.5, // 亮度影响大小
    color: getColorByBrightness(city.brightness),
    name: city.name,
    brightness: city.brightness,
  }));

  world
    .pointsData(pointsData)
    .pointAltitude(0.01)
    .pointRadius('size')
    .pointColor('color')
    .pointLabel((d: any) => `${d.name}: ${d.brightness}%`);
};

// 根据亮度获取颜色
const getColorByBrightness = (brightness: number): string => {
  if (brightness < 30) return '#ff4444'; // 暗红
  if (brightness < 60) return '#ffaa00'; // 橙色
  if (brightness < 90) return '#ffff00'; // 黄色
  return '#00ff88'; // 亮绿
};

// 渲染光束接力动画
const showRelayBeam = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  if (!world) return;

  const arcData = [{
    startLat: fromLat,
    startLng: fromLng,
    endLat: toLat,
    endLng: toLng,
    color: ['#00ff88', '#00ffff'],
  }];

  world
    .arcsData(arcData)
    .arcColor('color')
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(2000)
    .arcStroke(0.5);

  // 2秒后清除光束
  setTimeout(() => {
    world.arcsData([]);
  }, 2000);
};

onMounted(async () => {
  if (globeDiv.value) {
    // globe.gl 默认导出为构造器：new Globe(element)
    world = new (Globe as any)(globeDiv.value)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointOfView({ lat: 31.2304, lng: 121.4737, altitude: 2.5 });

    // Auto-rotate
    const controls = world.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
    }

    // 加载初始数据
    await loadStatus();

    // 每5秒刷新一次数据
    intervalId = window.setInterval(loadStatus, 5000);
  }
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

defineExpose({
  userCity,
  cities,
  loadStatus,
  showRelayBeam,
});
</script>

<template>
  <div ref="globeDiv" class="globe-container"></div>
</template>

<style scoped>
.globe-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}
</style>
