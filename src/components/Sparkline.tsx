import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline = ({ data, width = 60, height = 20, color = '#10b981' }: SparklineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const minValue = d3.min(data) ?? 0;
    const maxValue = d3.max(data) ?? 1;
    const hasFlatSeries = minValue === maxValue;
    const domainMin = hasFlatSeries ? minValue - 1 : minValue;
    const domainMax = hasFlatSeries ? maxValue + 1 : maxValue;

    const y = d3.scaleLinear()
      .domain([domainMin, domainMax])
      .range([height, 0]);

    const line = d3.line<number>()
      .x((_, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    const area = d3.area<number>()
      .x((_, i) => x(i))
      .y0(height)
      .y1(d => y(d))
      .curve(d3.curveMonotoneX);

    // Add gradient
    const gradientId = `sparkline-gradient-${Math.random().toString(36).substring(2, 9)}`;
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.4);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    svg.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Optional: Add a small dot at the end
    svg.append('circle')
      .attr('cx', x(data.length - 1))
      .attr('cy', y(data[data.length - 1]))
      .attr('r', 2)
      .attr('fill', color);

  }, [data, width, height, color]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="overflow-visible"
    />
  );
};
